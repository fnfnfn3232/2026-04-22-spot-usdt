import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./cloudflare-worker.js", import.meta.url), "utf8");
const { default: worker, BoardStore, createSessionToken, normalizeMemberRecord } = await import(
  `data:text/javascript;base64,${Buffer.from(`${source}\nexport { createSessionToken, normalizeMemberRecord };`).toString("base64")}`
);

class MemoryStorage {
  data = new Map();
  pending = Promise.resolve();
  async get(key) { return structuredClone(this.data.get(key)); }
  async put(key, value) { this.data.set(key, structuredClone(value)); }
  async delete(key) { return this.data.delete(key); }
  async transaction(callback) {
    const next = this.pending.then(async () => {
      const transaction = new MemoryStorage();
      transaction.data = structuredClone(this.data);
      const result = await callback(transaction);
      this.data = transaction.data;
      return result;
    });
    this.pending = next.catch(() => {});
    return next;
  }
}

async function fixture({ read = true, write = false } = {}) {
  const storage = new MemoryStorage();
  const member = normalizeMemberRecord({
    id: crypto.randomUUID(), email: "test@example.com", status: "active",
    boardReadApproved: read, boardWriteApproved: write, authVersion: 1,
  });
  await storage.put("site-members-v1", [member]);
  await storage.put("free-board-posts", [{ id: "original", title: "Existing post", body: "Existing body", createdAt: Date.now() }]);
  await storage.put("free-board-media:media-1234567890-12345678", {
    fileName: "test.txt", contentType: "text/plain", bytes: new TextEncoder().encode("attachment"),
  });
  const env = { SESSION_SECRET: "test-secret-not-production", FRONTEND_ORIGIN: "https://example.com" };
  const store = new BoardStore({ storage }, env);
  store.recordApiResponse = async (response) => response;
  store.recordMediaDownload = async () => {};
  store.tryAddAdminLog = async () => {};
  env.BOARD_STORE = { idFromName: () => "test", get: () => store };
  const memberToken = await createSessionToken(env, { role: "member", subject: member.id, authVersion: 1 });
  const adminToken = await createSessionToken(env, { role: "admin" });
  async function request(path, method = "GET", body, token = memberToken) {
    const headers = { Origin: env.FRONTEND_ORIGIN, "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return worker.fetch(new Request(`https://worker.example${path}`, {
      method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }), env);
  }
  const post = (extra = {}) => request("/api/board/posts", "POST", {
    title: "New post", body: "Post body", postPassword: "PostPassword1", ...extra,
  });
  return { store, storage, member, request, post, adminToken };
}

test("legacy board approval retains access; explicit read-only records cannot write", () => {
  const base = { id: crypto.randomUUID(), email: "legacy@example.com", boardWriteApproved: true };
  assert.equal(normalizeMemberRecord(base).boardReadApproved, true);
  assert.equal(normalizeMemberRecord({ ...base, boardReadApproved: false }).boardWriteApproved, false);
});

test("read-only member can read and download but every board mutation is denied", async () => {
  const f = await fixture();
  assert.equal((await f.request("/api/board/posts")).status, 200);
  assert.equal((await f.request("/api/board/categories")).status, 200);
  assert.equal((await f.request("/api/board/posts/original/view", "POST", {})).status, 200);
  const download = await f.request("/api/board/media/media-1234567890-12345678");
  assert.equal(download.status, 200);
  assert.equal(await download.text(), "attachment");
  for (const [method, path] of [
    ["POST", "/api/board/posts"], ["PUT", "/api/board/posts/original"],
    ["DELETE", "/api/board/posts/original"], ["POST", "/api/board/posts/original/verify"],
    ["POST", "/api/board/posts/original/comments"], ["DELETE", "/api/board/posts/original/comments/test"],
    ["POST", "/api/board/media"], ["POST", "/api/board/media/uploads"],
    ["POST", "/api/board/media/uploads/test/chunks/0"], ["POST", "/api/board/media/uploads/test/complete"],
  ]) {
    const response = await f.request(path, method, { boardWriteApproved: true });
    assert.equal(response.status, 403, `${method} ${path}`);
    assert.equal((await response.json()).error, "board_write_approval_required");
  }
});

test("only admin can approve writing; revocation takes effect for an existing session", async () => {
  const f = await fixture();
  const action = (name, token) => f.request(`/api/admin/members/${name}`, "POST", { memberId: f.member.id }, token);
  assert.equal((await action("board-write-approve")).status, 401);
  assert.equal((await action("board-write-approve", f.adminToken)).status, 200);
  assert.equal((await f.post()).status, 201);
  assert.equal((await action("board-write-revoke", f.adminToken)).status, 200);
  assert.equal((await f.post()).status, 403);
  const session = await (await f.request("/api/session")).json();
  assert.equal(session.boardReadApproved, true);
  assert.equal(session.boardWriteApproved, false);
  assert.equal((await f.request("/api/board/posts")).status, 200);
});

test("read approval does not grant write access and unapproved users cannot download", async () => {
  const f = await fixture({ read: false });
  for (const path of ["/api/board/posts", "/api/board/categories", "/api/board/media/media-1234567890-12345678"]) {
    assert.equal((await f.request(path)).status, 403);
    assert.equal((await f.request(path, "GET", undefined, "")).status, 401);
  }
  assert.equal((await f.request("/api/admin/members/board-write-approve", "POST", { memberId: f.member.id }, f.adminToken)).status, 409);
  assert.equal((await f.request("/api/admin/members/board-approve", "POST", { memberId: f.member.id }, f.adminToken)).status, 200);
  assert.equal((await f.request("/api/board/posts")).status, 200);
  assert.equal((await f.post()).status, 403);
});

test("concurrent posts stop at three; deleting posts and restarting cannot restore quota", async () => {
  const f = await fixture({ write: true });
  const responses = await Promise.all(Array.from({ length: 8 }, () => f.post({ id: "original", createdAt: 1, authorMemberId: crypto.randomUUID() })));
  assert.equal(responses.filter((r) => r.status === 201).length, 3);
  assert.equal(responses.filter((r) => r.status === 429).length, 5);
  const rows = await f.store.readPosts();
  assert.equal(rows.find((row) => row.id === "original").title, "Existing post");
  const created = rows.filter((row) => row.authorMemberId === f.member.id);
  assert.equal(created.length, 3);
  assert.ok(created.every((row) => row.createdAt > 1));
  for (const row of created) assert.equal((await f.request(`/api/board/posts/${row.id}`, "DELETE", {})).status, 200);
  assert.equal((await f.post()).status, 429);
  const freshStore = new BoardStore({ storage: f.storage }, f.store.env);
  const result = await freshStore.createPostWithDailyLimit({ id: "another", title: "x", body: "y" }, {
    role: "member", subject: f.member.id, authVersion: 1,
  });
  assert.equal(result.error, "board_daily_post_limit");
});

test("quota resets at Korea midnight, applies per member, and excludes invalid submissions and admins", async () => {
  const originalNow = Date.now;
  try {
    let now = Date.parse("2026-09-05T23:59:59+09:00");
    Date.now = () => now;
    const f = await fixture({ write: true });
    assert.equal((await f.post({ title: "" })).status, 400);
    for (let i = 0; i < 3; i++) assert.equal((await f.post()).status, 201);
    const limited = await (await f.post()).json();
    assert.equal(limited.resetsAt, Date.parse("2026-09-06T00:00:00+09:00"));
    const other = await fixture({ write: true });
    assert.equal((await other.post()).status, 201);
    for (let i = 0; i < 4; i++) {
      assert.equal((await f.request("/api/board/posts", "POST", { title: "Admin", body: "body", postPassword: "admin-post" }, f.adminToken)).status, 201);
    }
    now += 1000;
    assert.equal((await f.post()).status, 201);
  } finally {
    Date.now = originalNow;
  }
});

test("quota counts posts already created today before rollout", async () => {
  const f = await fixture({ write: true });
  await f.store.writePosts(Array.from({ length: 3 }, (_, i) => ({
    id: `old-${i}`, title: "Old", body: "body", createdAt: Date.now(), authorMemberId: f.member.id,
  })));
  assert.equal((await f.post()).status, 429);
});

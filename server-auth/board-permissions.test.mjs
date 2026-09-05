import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./cloudflare-worker.js", import.meta.url), "utf8");
const { default: worker, BoardStore, createSessionToken, normalizeMemberRecord } = await import(
  `data:text/javascript;base64,${Buffer.from(`${source}\nexport { createSessionToken, normalizeMemberRecord };\n//# sourceURL=cloudflare-worker-under-test.mjs`).toString("base64")}`
);

class MemoryStorage {
  data = new Map();
  pending = Promise.resolve();
  async get(key) { return structuredClone(this.data.get(key)); }
  async put(key, value) { this.data.set(key, structuredClone(value)); }
  async delete(key) {
    if (Array.isArray(key)) return key.map((item) => this.data.delete(item)).filter(Boolean).length;
    return this.data.delete(key);
  }
  async list({ prefix = "" } = {}) {
    return new Map([...this.data].filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key, structuredClone(value)]));
  }
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
    boardPermissionVersion: 2,
    boardReadApproved: read, boardWriteApproved: write, authVersion: 1,
  });
  await storage.put("site-members-v1", [member]);
  await storage.put("free-board-posts", [{ id: "original", title: "Existing post", body: "Existing body", createdAt: Date.now() }]);
  await storage.put("free-board-media:media-1234567890-12345678", {
    fileName: "test.txt", contentType: "text/plain", bytes: new TextEncoder().encode("attachment"),
  });
  const env = { SESSION_SECRET: "test-secret-not-production", FRONTEND_ORIGIN: "https://example.com" };
  const adminPassword = "AdminPasswordForTests1";
  env.SITE_PASSWORD_SHA256 = Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(adminPassword))).toString("hex");
  const store = new BoardStore({ storage }, env);
  store.recordApiResponse = async (response) => response;
  store.recordMediaDownload = async () => {};
  store.tryAddAdminLog = async () => {};
  env.BOARD_STORE = { idFromName: () => "test", get: () => store };
  const memberToken = await createSessionToken(env, { role: "member", subject: member.id, authVersion: 1 });
  const adminToken = await createSessionToken(env, { role: "admin" });
  async function rawRequest(path, method = "GET", body, token = memberToken, extraHeaders = {}) {
    const headers = { Origin: env.FRONTEND_ORIGIN, "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return worker.fetch(new Request(`https://worker.example${path}`, {
      method, headers: { ...headers, ...extraHeaders }, ...(body === undefined ? {} : { body, ...(body instanceof ReadableStream ? { duplex: "half" } : {}) }),
    }), env);
  }
  const request = (path, method = "GET", body, token = memberToken) => rawRequest(path, method, body === undefined ? undefined : JSON.stringify(body), token);
  const post = (extra = {}) => request("/api/board/posts", "POST", {
    title: "New post", body: "Post body", postPassword: "PostPassword1", ...extra,
  });
  return { store, storage, member, request, rawRequest, post, adminToken, memberToken, adminPassword, env };
}

test("all existing active members migrate to read-only; migration is idempotent", () => {
  const base = { id: crypto.randomUUID(), email: "legacy@example.com", status: "active" };
  for (const permissions of [{}, { boardWriteApproved: true }, { boardReadApproved: false, boardWriteApproved: false }]) {
    const migrated = normalizeMemberRecord({ ...base, ...permissions });
    assert.equal(migrated.boardReadApproved, true);
    assert.equal(migrated.boardWriteApproved, false);
    assert.equal(migrated.boardWriteApprovedAt, 0);
    assert.deepEqual(normalizeMemberRecord(migrated), migrated);
  }
  assert.equal(normalizeMemberRecord({ ...base, status: "pending" }).boardReadApproved, false);
  assert.equal(normalizeMemberRecord({ ...base, boardPermissionVersion: 2, boardReadApproved: true, boardWriteApproved: true }).boardWriteApproved, true);
  assert.equal(normalizeMemberRecord({ ...base, boardPermissionVersion: 2, boardReadApproved: false, boardWriteApproved: true }).boardWriteApproved, false);
});

test("membership approval and restoration automatically grant reading, never writing", async () => {
  for (const [status, action] of [["pending", "approve"], ["revoked", "restore"]]) {
    const f = await fixture({ read: false });
    await f.storage.put("site-members-v1", [{ ...f.member, status, passwordSalt: "test-salt", passwordHash: "test-hash" }]);
    assert.equal((await f.request("/api/board/posts")).status, 401);
    assert.equal((await f.request(`/api/admin/members/${action}`, "POST", { memberId: f.member.id }, f.adminToken)).status, 200);
    assert.equal((await f.request("/api/board/posts")).status, 200);
    assert.equal((await f.request("/api/board/media/media-1234567890-12345678")).status, 200);
    assert.equal((await f.post()).status, 403);
  }
});

test("existing member sessions become read-only immediately and later write approval persists", async () => {
  const f = await fixture({ write: true });
  const { boardPermissionVersion, ...legacy } = f.member;
  await f.storage.put("site-members-v1", [legacy]);
  assert.equal((await f.request("/api/board/posts")).status, 200);
  assert.equal((await f.post()).status, 403);
  assert.equal((await f.request("/api/admin/members/board-write-approve", "POST", { memberId: f.member.id }, f.adminToken)).status, 200);
  assert.equal((await f.post()).status, 201);
  assert.equal((await f.store.readMembers())[0].boardWriteApproved, true);
  assert.equal((await f.request("/api/admin/members/board-revoke", "POST", { memberId: f.member.id }, f.adminToken)).status, 200);
  assert.equal((await f.request("/api/board/posts")).status, 403);
  assert.equal((await f.store.readMembers())[0].boardReadApproved, false);
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

test("another writer cannot edit or delete posts/comments even with their legacy passwords", async () => {
  const f = await fixture({ write: true });
  const other = { ...f.member, id: crypto.randomUUID(), email: "other@example.com" };
  await f.storage.put("site-members-v1", [f.member, other]);
  const otherToken = await createSessionToken(f.env, { role: "member", subject: other.id, authVersion: 1 });
  const created = await (await f.post()).json();
  const path = `/api/board/posts/${created.post.id}`;
  const comment = (await (await f.request(`${path}/comments`, "POST", { body: "Comment", commentPassword: "KnownPassword1" })).json()).comment;
  for (const [method, route, body] of [
    ["PUT", path, { title: "Overwritten", body: "bad", postPassword: "PostPassword1" }],
    ["POST", `${path}/verify`, { postPassword: "PostPassword1" }],
    ["DELETE", path, { postPassword: "PostPassword1" }],
    ["DELETE", `${path}/comments/${comment.id}`, { commentPassword: "KnownPassword1" }],
  ]) assert.equal((await f.request(route, method, body, otherToken)).status, 401, route);
  assert.equal((await f.request(path, "PUT", { title: "Owner edit", body: "body" })).status, 200);
  assert.equal((await f.request(`${path}/comments/${comment.id}`, "DELETE", {})).status, 200);
  assert.equal((await f.request(path, "DELETE", {}, f.adminToken)).status, 200);
});

test("comment IDs, timestamps and ownership cannot be supplied by the client", async () => {
  const f = await fixture({ write: true });
  const body = { id: "injected", createdAt: 1, authorMemberId: crypto.randomUUID(), body: "text", commentPassword: "Known1" };
  const comment = (await (await f.request("/api/board/posts/original/comments", "POST", body)).json()).comment;
  assert.notEqual(comment.id, "injected");
  assert.ok(comment.createdAt > 1);
  assert.equal(comment.authorMemberId, f.member.id);
});

test("upload ownership, concurrent chunks, finalization and temporary cleanup", async () => {
  for (const useR2 of [false, true]) {
    const f = await fixture({ write: true });
    const objects = new Map();
    if (useR2) f.env.BOARD_MEDIA_BUCKET = {
      async put(key, bytes) { objects.set(key, new Uint8Array(bytes)); },
      async head(key) { return objects.has(key) ? { size: objects.get(key).byteLength } : null; },
      async get(key) { return objects.has(key) ? { size: objects.get(key).byteLength, arrayBuffer: async () => objects.get(key).slice().buffer } : null; },
      async delete(key) { objects.delete(key); },
    };
    const other = { ...f.member, id: crypto.randomUUID(), email: "other@example.com" };
    await f.storage.put("site-members-v1", [f.member, other]);
    const otherToken = await createSessionToken(f.env, { role: "member", subject: other.id, authVersion: 1 });
    const size = (useR2 ? 8 : 1) * 1024 * 1024 + 3;
    const init = await (await f.request("/api/board/media/uploads", "POST", { fileName: "test.txt", contentType: "text/plain", size, ownerSubject: other.id })).json();
    const path = `/api/board/media/uploads/${init.uploadId}`;
    const binaryHeaders = { "Content-Type": "application/octet-stream" };
    assert.equal((await f.rawRequest(`${path}/chunks/0`, "POST", new Uint8Array(init.chunkSize), otherToken, binaryHeaders)).status, 403);
    assert.equal((await f.request(`${path}/complete`, "POST", {}, otherToken)).status, 403);
    const chunks = await Promise.all([init.chunkSize, 3].map((length, i) => f.rawRequest(`${path}/chunks/${i}`, "POST", new Uint8Array(length).fill(i + 1), f.memberToken, binaryHeaders)));
    assert.ok(chunks.every((r) => r.status === 200));
    assert.deepEqual((await f.store.readMediaUpload(init.uploadId)).uploadedChunks, [0, 1]);
    const complete = await f.request(`${path}/complete`, "POST", {});
    assert.equal(complete.status, 201);
    const media = await complete.json();
    const download = await f.request(`/api/board/media/${media.id}`);
    assert.equal(download.status, 200);
    const downloaded = new Uint8Array(await download.arrayBuffer());
    assert.equal(downloaded.length, size);
    assert.equal(downloaded[0], 1);
    assert.equal(downloaded.at(-1), 2);
    assert.equal((await f.rawRequest(`${path}/chunks/1`, "POST", new Uint8Array(3), f.memberToken, binaryHeaders)).status, 404);
    assert.equal([...f.storage.data.keys()].some((key) => key.includes(init.uploadId)), false);
  }
});

test("all admin password endpoints share an atomic limit and cannot spoof the client IP header", async () => {
  const f = await fixture({ write: true });
  const paths = ["/api/admin/verify", "/api/login", "/api/admin/members", "/api/screen-settings", "/api/board/categories", "/api/board/logs", "/api/usage/stats"];
  const responses = await Promise.all(Array.from({ length: 20 }, (_, i) => f.rawRequest(paths[i % paths.length], "POST",
    JSON.stringify({ password: "wrong" }), f.memberToken, { "CF-Connecting-IP": "192.0.2.10", "X-Login-Client-IP": `spoof-${i}` })));
  assert.equal(responses.filter((r) => r.status === 401).length, 9);
  assert.equal(responses.filter((r) => r.status === 429).length, 11);
  assert.equal((await f.rawRequest("/api/admin/verify", "POST", f.adminPassword, "", { "Content-Type": "text/plain", "CF-Connecting-IP": "192.0.2.10" })).status, 429);
  const login = await f.rawRequest("/api/login", "POST", JSON.stringify({ password: f.adminPassword }), "", { "CF-Connecting-IP": "192.0.2.11" });
  assert.equal(login.status, 200);
  assert.equal((await f.request("/api/screen-settings", "PUT", { settings: {} }, (await login.json()).token)).status, 200);
});

test("refresh preserves login; logout revokes the entire refresh chain for members and admins", async () => {
  for (const role of ["member", "admin"]) {
    const f = await fixture();
    const token = role === "member" ? f.memberToken : f.adminToken;
    const session = await (await f.request("/api/session", "GET", undefined, token)).json();
    assert.equal(session.role, role);
    const originalNow = Date.now;
    let renewed;
    try {
      Date.now = () => originalNow() + 2000;
      const response = await f.request("/api/session", "GET", undefined, session.token);
      assert.equal(response.status, 200);
      renewed = await response.json();
      assert.notEqual(renewed.token, session.token);
    } finally {
      Date.now = originalNow;
    }
    const form = new URLSearchParams({ token: session.token }).toString();
    assert.equal((await f.rawRequest("/api/session", "POST", form, "", { "Content-Type": "application/x-www-form-urlencoded" })).status, 200);
    const logout = await f.request("/api/logout", "POST", {}, session.token);
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("Set-Cookie"), /Max-Age=0/);
    for (const copy of [token, session.token, renewed.token]) {
      for (const path of ["/api/session", "/api/board/posts", "/api/board/media/media-1234567890-12345678", "/api/screen-settings"])
        assert.equal((await f.request(path, "GET", undefined, copy)).status, 401, `${role} ${path}`);
    }
    const freshToken = await createSessionToken(f.env, { role, subject: f.member.id, authVersion: 1 });
    assert.equal((await f.request("/api/board/posts", "GET", undefined, freshToken)).status, 200);
  }
});

test("a member or invalid bearer token cannot inherit a stale admin cookie", async () => {
  const f = await fixture();
  const headers = { Cookie: `coin_board_session=${f.adminToken}` };
  assert.equal((await f.rawRequest("/api/admin/members", "POST", "{}", f.memberToken, headers)).status, 401);
  assert.equal((await f.rawRequest("/api/board/posts", "GET", undefined, "invalid", headers)).status, 401);
  assert.equal((await f.rawRequest("/api/board/posts", "GET", undefined, "", headers)).status, 200);
});

test("untrusted origins, missing/forged/revoked sessions cannot access private content", async () => {
  const f = await fixture();
  for (const path of ["/api/board/posts", "/api/board/categories", "/api/board/media/media-1234567890-12345678", "/api/screen-settings", "/api/market-data", "/api/news"]) {
    assert.equal((await f.rawRequest(path, "GET", undefined, f.memberToken, { Origin: "https://attacker.example" })).status, 403);
    for (const token of ["", "invalid", `${f.memberToken}modified`]) assert.equal((await f.request(path, "GET", undefined, token)).status, 401);
  }
  await f.storage.put("site-members-v1", [{ ...f.member, status: "revoked" }]);
  assert.equal((await f.request("/api/board/posts")).status, 401);
  await f.storage.put("site-members-v1", [{ ...f.member, authVersion: 2 }]);
  assert.equal((await f.request("/api/session")).status, 401);
});

test("oversized streaming bodies are stopped without trusting Content-Length; invalid JSON fails closed", async () => {
  const f = await fixture();
  for (const body of ["null", "[]", "42", "{bad"]) {
    for (const contentType of ["application/json", "text/plain"])
      assert.equal((await f.rawRequest("/api/login/member/password", "POST", body, "", { "Content-Type": contentType })).status, 400);
  }
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(64 * 1024)); },
    cancel() { cancelled = true; },
  });
  assert.equal((await f.rawRequest("/api/signup/request", "POST", stream, "", { "Content-Length": "1" })).status, 413);
  assert.equal(cancelled, true);
  assert.equal((await f.rawRequest("/api/board/media", "POST", new Uint8Array(8 * 1024 * 1024 + 1))).status, 413);
});

test("authentication does not fall back to stateless access without its storage binding", async () => {
  const f = await fixture();
  delete f.env.BOARD_STORE;
  assert.equal((await f.request("/api/login", "POST", { password: f.adminPassword }, "")).status, 503);
  assert.equal((await f.request("/api/admin/verify", "POST", { password: f.adminPassword }, "")).status, 503);
  assert.equal((await f.request("/api/session", "GET", undefined, f.adminToken)).status, 503);
  assert.equal((await f.request("/api/screen-settings", "GET", undefined, f.adminToken)).status, 503);
  assert.equal((await f.request("/api/board/posts", "GET", undefined, f.adminToken)).status, 503);
});

test("concurrent view counts, comments and post creation cannot overwrite each other", async () => {
  const f = await fixture({ write: true });
  const responses = await Promise.all(Array.from({ length: 10 }, (_, i) => [
    f.request("/api/board/posts/original/view", "POST", {}),
    f.request("/api/board/posts/original/comments", "POST", { body: `Comment ${i}`, commentPassword: "Password1" }),
    f.post(),
  ]).flat());
  assert.equal(responses.filter((r) => r.status === 429).length, 7);
  assert.equal(responses.filter((r) => r.status === 201).length, 13);
  const posts = await f.store.readPosts();
  const original = posts.find((post) => post.id === "original");
  assert.equal(original.views, 10);
  assert.equal(original.comments.length, 10);
  assert.equal(posts.length, 4);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workerUrl = new URL("./cloudflare-worker.js", import.meta.url);
const source = await readFile(workerUrl, "utf8");
const testSource = `${source}\nexport { hasUnsafeBoardHtml, mediaHeaders, cleanBoardMediaFileName };`;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(testSource).toString("base64")}`;
const { hasUnsafeBoardHtml, mediaHeaders, cleanBoardMediaFileName } = await import(moduleUrl);

assert.equal(hasUnsafeBoardHtml({ htmlEnabled: true, body: "<p><strong>safe</strong></p>" }), false);
assert.equal(hasUnsafeBoardHtml({ htmlEnabled: true, body: "<script>alert(1)</script>" }), true);
assert.equal(hasUnsafeBoardHtml({ htmlEnabled: true, body: '<img src="https://example.com/a.png" onerror="alert(1)">' }), true);
assert.equal(hasUnsafeBoardHtml({ htmlEnabled: true, body: '<a href="javascript:alert(1)">link</a>' }), true);
assert.equal(hasUnsafeBoardHtml({ htmlEnabled: true, body: '<svg><script>alert(1)</script></svg>' }), true);

const safeImageHeaders = mediaHeaders({ fileName: "photo.png", contentType: "image/png", size: 10 });
assert.equal(safeImageHeaders.get("Content-Type"), "image/png");
assert.match(safeImageHeaders.get("Content-Disposition"), /^inline;/);

for (const media of [
  { fileName: "page.html", contentType: "text/html" },
  { fileName: "image.svg", contentType: "image/svg+xml" },
  { fileName: "page.html", contentType: "image/png" },
  { fileName: "photo.png", contentType: "text/html" },
  { fileName: "program.exe", contentType: "application/octet-stream" },
]) {
  const headers = mediaHeaders(media);
  assert.equal(headers.get("Content-Type"), "application/octet-stream");
  assert.match(headers.get("Content-Disposition"), /^attachment;/);
  assert.equal(headers.get("X-Content-Type-Options"), "nosniff");
}

assert.equal(cleanBoardMediaFileName("../bad\r\nname.html"), "_badname.html");

console.log("security regression checks passed");

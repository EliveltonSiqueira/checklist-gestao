// Gera dist/sw.js com a lista de arquivos do build (cache offline do PWA).
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk("dist").map(p => relative("dist", p).split(sep).join("/")).filter(f => f !== "sw.js");
const version = Date.now();

writeFileSync("dist/sw.js", `const CACHE = "checklist-${version}";
const FILES = ${JSON.stringify(["./", ...files])};
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).catch(() => caches.match("./"))));
});
`);
console.log("sw.js gerado com", files.length, "arquivos");

import { EMPRESA, MARCA, LOJAS, CHECKLISTS } from "./config.js";
import { buildPdf } from "./pdf.js";
import { isNative, initNative, saveDraft, loadDraft, takePhotos, compressFile, savePdf } from "./native.js";

/* ============ ESTADO ============ */
let tipo = "abertura";
const state = { abertura: blank(), fechamento: blank() };
let photoTarget = null;

function today() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
function nowHM() { return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
function blank() { return { nome: "", loja: LOJAS[0], data: today(), inicio: "", resp: {} }; }
function allItems(t) { const out = []; let n = 0; CHECKLISTS[t].grupos.forEach((g, gi) => g.itens.forEach((it, ii) => { n++; out.push({ ...it, id: gi + "-" + ii, n, grupo: g.nome }); })); return out; }
function r(id) { const s = state[tipo]; if (!s.resp[id]) s.resp[id] = { s: "", obs: "", fotos: [] }; return s.resp[id]; }

/* ---- rascunho (a cada alteração, com pequeno atraso) ---- */
let pT = null;
function persist() { clearTimeout(pT); pT = setTimeout(flush, 250); }
function flush() { clearTimeout(pT); pT = null; return saveDraft(JSON.stringify(state), state[tipo].nome); }
async function restore() {
  const { json, nome } = await loadDraft();
  try { if (json) { const o = JSON.parse(json); for (const t of ["abertura", "fechamento"]) if (o[t]) state[t] = Object.assign(blank(), o[t]); } } catch (_) {}
  if (nome) for (const t of ["abertura", "fechamento"]) if (!state[t].nome) state[t].nome = nome;
}
document.addEventListener("visibilitychange", () => { if (document.hidden) flush(); });
window.addEventListener("pagehide", () => flush());

/* ============ UI ============ */
const $ = id => document.getElementById(id);
const ICON_CAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
const ICON_TXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function render() {
  const s = state[tipo];
  $("title").textContent = CHECKLISTS[tipo].titulo;
  document.querySelectorAll(".seg button").forEach(b => b.classList.toggle("active", b.dataset.tipo === tipo));
  $("nome").value = s.nome; $("loja").value = s.loja; $("data").value = s.data;
  $("inicioInfo").textContent = s.inicio ? "Iniciado às " + s.inicio : "O horário de início é registrado na primeira resposta.";
  let html = "", idx = 0;
  CHECKLISTS[tipo].grupos.forEach((g, gi) => {
    html += `<div class="group-title">${esc(g.nome)}<span id="gc-${gi}"></span></div>`;
    g.itens.forEach((it, ii) => { idx++; html += itemHTML(it, gi + "-" + ii, idx); });
  });
  $("list").innerHTML = html;
  updateProgress();
}
function itemHTML(it, id, n) {
  const a = state[tipo].resp[id] || { s: "", obs: "", fotos: [] };
  const showCam = true;
  const showObs = a.obs || a.s === "NC";
  return `<div class="item ${a.s ? "s-" + a.s : ""}" id="it-${id}" data-id="${id}">
    <div class="q"><div class="num">${n}</div><p>${esc(it.t)}</p></div>
    <div class="opts">
      ${["C", "NC", "NA"].map(k => `<button class="opt ${k} ${a.s === k ? "on" : ""}" data-act="set" data-v="${k}">${k === "C" ? "Conforme" : k === "NC" ? "Não conforme" : "N/A"}</button>`).join("")}
    </div>
    <div class="tools">
      <button class="tbtn" data-act="obs">${ICON_TXT} Observação</button>
      ${showCam ? `<button class="tbtn" data-act="foto">${ICON_CAM} Foto${a.fotos.length ? " (" + a.fotos.length + ")" : ""}</button>` : ""}
    </div>
    <div class="obs ${showObs ? "show" : ""}"><textarea data-act="obstxt" placeholder="${a.s === "NC" ? "Descreva a não conformidade e a ação tomada" : "Observação (opcional)"}">${esc(a.obs)}</textarea></div>
    ${a.fotos.length ? `<div class="thumbs">${a.fotos.map((f, i) => `<div class="thumb"><img src="${f}" alt="Foto ${i + 1}"><button data-act="rmfoto" data-i="${i}" aria-label="Remover foto">×</button></div>`).join("")}</div>` : ""}
  </div>`;
}
function refreshItem(id) {
  const [gi, ii] = id.split("-").map(Number);
  const it = CHECKLISTS[tipo].grupos[gi].itens[ii];
  const n = allItems(tipo).find(x => x.id === id).n;
  const el = $("it-" + id); const tmp = document.createElement("div"); tmp.innerHTML = itemHTML(it, id, n);
  el.replaceWith(tmp.firstElementChild);
}
function counts(t) {
  const items = allItems(t), s = state[t]; const c = { C: 0, NC: 0, NA: 0, total: items.length };
  items.forEach(i => { const a = s.resp[i.id]; if (a && a.s) c[a.s]++; });
  c.done = c.C + c.NC + c.NA; c.pend = c.total - c.done;
  c.conf = (c.C + c.NC) ? Math.round(c.C / (c.C + c.NC) * 100) : null;
  return c;
}
function updateProgress() {
  const c = counts(tipo);
  $("pDone").textContent = c.done; $("pTotal").textContent = c.total;
  const p = Math.round(c.done / c.total * 100); $("pPct").textContent = p + "%"; $("pBar").style.width = p + "%";
  $("cC").textContent = c.C + " conforme"; $("cNC").textContent = c.NC + " não conforme"; $("cNA").textContent = c.NA + " não se aplica";
  $("cPct").textContent = "Conformidade " + (c.conf === null ? "—" : c.conf + "%");
  CHECKLISTS[tipo].grupos.forEach((g, gi) => {
    const done = g.itens.filter((_, ii) => { const a = state[tipo].resp[gi + "-" + ii]; return a && a.s; }).length;
    const el = $("gc-" + gi); if (el) el.textContent = done + "/" + g.itens.length;
  });
}
function markStart() { const s = state[tipo]; if (!s.inicio) { s.inicio = nowHM(); $("inicioInfo").textContent = "Iniciado às " + s.inicio; } }

/* ---- diálogo (próprio) e aviso ---- */
let dRes = null;
/** buttons: [{label, value, primary}] — padrão: Cancelar / Confirmar */
function choose(title, msg, buttons) {
  $("dTitle").textContent = title; $("dMsg").textContent = msg;
  const row = $("dRow"); row.innerHTML = ""; row.classList.toggle("three", buttons.length > 2);
  buttons.forEach(b => {
    const el = document.createElement("button"); el.className = "btn " + (b.primary ? "pri" : "sec"); el.textContent = b.label;
    el.onclick = () => closeD(b.value); row.appendChild(el);
  });
  $("overlay").classList.add("show"); return new Promise(res => dRes = res);
}
function ask(title, msg, yes = "Confirmar", no = "Cancelar") {
  return choose(title, msg, [{ label: no, value: false }, { label: yes, value: true, primary: true }]);
}
function closeD(v) { $("overlay").classList.remove("show"); if (dRes) { dRes(v); dRes = null; } }
$("overlay").addEventListener("click", e => { if (e.target.id === "overlay") closeD(false); });
let tT; function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tT); tT = setTimeout(() => t.classList.remove("show"), 2600); }

/* ---- eventos ---- */
document.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => { tipo = b.dataset.tipo; render(); window.scrollTo({ top: 0 }); }));
$("nome").addEventListener("input", e => { state[tipo].nome = e.target.value; e.target.classList.remove("err"); persist(); });
$("loja").addEventListener("change", e => { state[tipo].loja = e.target.value; persist(); });
$("data").addEventListener("change", e => { state[tipo].data = e.target.value; persist(); });

async function addPhotos(id, list) {
  if (!list.length) return;
  list.forEach(f => r(id).fotos.push(f));
  markStart(); refreshItem(id); persist(); toast(list.length > 1 ? list.length + " fotos adicionadas" : "Foto adicionada");
}
async function pickPhoto(id) {
  if (!isNative) { photoTarget = id; $("fileIn").value = ""; $("fileIn").click(); return; }
  const src = await choose("Adicionar foto", "Escolha de onde vem a foto.", [
    { label: "Tirar foto", value: "camera", primary: true },
    { label: "Escolher da galeria", value: "gallery" },
    { label: "Cancelar", value: false },
  ]);
  if (!src) return;
  try { toast("Processando foto…"); await addPhotos(id, await takePhotos(src)); }
  catch (e) { console.error(e); toast("Não foi possível obter a foto. Verifique as permissões do app."); }
}

$("list").addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const item = b.closest(".item"); const id = item.dataset.id; const act = b.dataset.act;
  if (act === "set") {
    const a = r(id); a.s = a.s === b.dataset.v ? "" : b.dataset.v; markStart(); refreshItem(id); updateProgress(); persist();
    if (a.s === "NC") { const t = $("it-" + id).querySelector("textarea"); if (t && !a.obs) t.focus({ preventScroll: true }); }
  }
  else if (act === "obs") { const o = item.querySelector(".obs"); o.classList.toggle("show"); if (o.classList.contains("show")) o.querySelector("textarea").focus(); }
  else if (act === "foto") { pickPhoto(id); }
  else if (act === "rmfoto") { const i = +b.dataset.i; ask("Remover foto?", "A foto será removida deste item.", "Remover").then(ok => { if (!ok) return; r(id).fotos.splice(i, 1); refreshItem(id); persist(); }); }
});
$("list").addEventListener("input", e => { if (e.target.dataset.act === "obstxt") { const id = e.target.closest(".item").dataset.id; r(id).obs = e.target.value; persist(); } });

// Fallback de navegador (fora do app nativo)
$("fileIn").addEventListener("change", async e => {
  const files = [...e.target.files]; if (!files.length || !photoTarget) return;
  const id = photoTarget; toast("Processando foto" + (files.length > 1 ? "s" : "") + "…");
  const out = [];
  for (const f of files) { try { out.push(await compressFile(f)); } catch (_) { toast("Não foi possível ler uma das imagens."); } }
  addPhotos(id, out);
});

$("btnNovo").addEventListener("click", async () => {
  const ok = await ask("Iniciar novo checklist?", "Todas as respostas, observações e fotos do checklist de " + tipo + " serão apagadas.", "Apagar e iniciar");
  if (!ok) return; const nome = state[tipo].nome, loja = state[tipo].loja; state[tipo] = blank(); state[tipo].nome = nome; state[tipo].loja = loja; persist(); render(); window.scrollTo({ top: 0 }); toast("Novo checklist iniciado");
});

/* ============ PDF ============ */
$("btnPdf").addEventListener("click", async () => {
  const s = state[tipo];
  if (!s.nome.trim()) { $("nome").classList.add("err"); $("nome").scrollIntoView({ behavior: "smooth", block: "center" }); $("nome").focus(); toast("Informe o nome do responsável."); return; }
  const c = counts(tipo);
  const items = allItems(tipo);
  document.querySelectorAll(".item.missing").forEach(x => x.classList.remove("missing"));
  const ncSemObs = items.filter(i => { const a = s.resp[i.id]; return a && a.s === "NC" && !a.obs.trim(); });
  let warn = [];
  if (c.pend) warn.push(c.pend + (c.pend > 1 ? " itens sem resposta." : " item sem resposta."));
  if (ncSemObs.length) warn.push(ncSemObs.length + (ncSemObs.length > 1 ? " não conformidades sem observação." : " não conformidade sem observação."));
  if (warn.length) {
    const ok = await ask("Checklist incompleto", warn.join("\n") + "\n\nDeseja gerar o PDF mesmo assim?", "Gerar mesmo assim", "Voltar e completar");
    if (!ok) {
      const first = items.find(i => !(s.resp[i.id] && s.resp[i.id].s)) || ncSemObs[0];
      items.forEach(i => { const a = s.resp[i.id]; if (!(a && a.s) || (a.s === "NC" && !a.obs.trim())) { const el = $("it-" + i.id); if (el) el.classList.add("missing"); } });
      if (first) $("it-" + first.id).scrollIntoView({ behavior: "smooth", block: "center" }); return;
    }
  }
  const btn = $("btnPdf"); btn.disabled = true; btn.textContent = "Gerando PDF…";
  await new Promise(res => setTimeout(res, 30)); // deixa o botão repintar
  try {
    const doc = buildPdf(tipo, s, c, items);
    const fn = `checklist-${tipo}-${s.loja.toLowerCase().replace(/\s+/g, "")}-${s.data}.pdf`;
    const res = await savePdf(doc, fn);
    toast(res === "cancelled" ? "Compartilhamento cancelado." : res === "shared" ? "PDF pronto" : "PDF gerado");
  } catch (err) { console.error(err); toast("Erro ao gerar o PDF."); }
  finally { btn.disabled = false; btn.textContent = "Gerar PDF"; }
});

/* ============ INÍCIO ============ */
(async function init() {
  $("brand").textContent = EMPRESA + " • Gestão de loja";
  $("credit").innerHTML = "Desenvolvido por <b>" + esc(MARCA) + "</b>";
  $("loja").innerHTML = LOJAS.map(l => `<option>${esc(l)}</option>`).join("");
  await initNative();
  if (!isNative && "serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {});
  await restore();
  render();
})();

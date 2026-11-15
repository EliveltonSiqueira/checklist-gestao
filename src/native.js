import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Preferences } from "@capacitor/preferences";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

export const isNative = Capacitor.isNativePlatform();

/* ---------- inicialização ---------- */
export async function initNative() {
  if (!isNative) return;
  try { await StatusBar.setStyle({ style: Style.Dark }); } catch (_) {}
  try { await StatusBar.setBackgroundColor({ color: "#1A120E" }); } catch (_) {}
  try { await StatusBar.setOverlaysWebView({ overlay: false }); } catch (_) {}
  try { await SplashScreen.hide(); } catch (_) {}
}

/* ---------- rascunho ----------
   Respostas e fotos vão para um arquivo no armazenamento do app (suporta tamanhos grandes).
   O último nome usado fica em Preferences. */
const DRAFT = "draft.json";

export async function saveDraft(json, nome) {
  if (!isNative) {
    try { localStorage.setItem("checklist-gestao-v2", json); } catch (_) {}
    try { if (nome) localStorage.setItem("checklist-gestao-v2-nome", nome); } catch (_) {}
    return;
  }
  try { await Filesystem.writeFile({ path: DRAFT, data: json, directory: Directory.Data, encoding: "utf8" }); } catch (e) { console.warn("draft", e); }
  try { if (nome) await Preferences.set({ key: "nome", value: nome }); } catch (_) {}
}

export async function loadDraft() {
  let json = null, nome = null;
  if (!isNative) {
    try { json = localStorage.getItem("checklist-gestao-v2"); } catch (_) {}
    try { nome = localStorage.getItem("checklist-gestao-v2-nome"); } catch (_) {}
    return { json, nome };
  }
  try { const r = await Filesystem.readFile({ path: DRAFT, directory: Directory.Data, encoding: "utf8" }); json = r.data; } catch (_) {}
  try { const r = await Preferences.get({ key: "nome" }); nome = r.value; } catch (_) {}
  return { json, nome };
}

/* ---------- fotos ---------- */
function compress(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1100; let w = img.naturalWidth, h = img.naturalHeight;
      const k = Math.min(1, MAX / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
      res(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => rej(new Error("img"));
    img.src = src;
  });
}

export async function compressFile(file) {
  const url = URL.createObjectURL(file);
  try { return await compress(url); } finally { URL.revokeObjectURL(url); }
}

/** source: "camera" | "gallery". Retorna lista de dataURLs comprimidas (vazia se cancelado). */
export async function takePhotos(source) {
  try {
    if (source === "camera") {
      const p = await Camera.getPhoto({
        source: CameraSource.Camera, resultType: CameraResultType.DataUrl,
        quality: 85, correctOrientation: true, width: 1600, saveToGallery: false,
      });
      return [await compress(p.dataUrl)];
    }
    const r = await Camera.pickImages({ quality: 85, limit: 10, correctOrientation: true });
    const out = [];
    for (const ph of r.photos) out.push(await compress(Capacitor.convertFileSrc(ph.path || ph.webPath)));
    return out;
  } catch (e) {
    const m = String((e && e.message) || e);
    if (/cancel/i.test(m)) return [];
    throw e;
  }
}

/* ---------- PDF ---------- */
/** Retorna "shared" | "cancelled" | "downloaded" */
export async function savePdf(doc, fn) {
  if (isNative) {
    const dataUri = doc.output("datauristring");
    const b64 = dataUri.slice(dataUri.indexOf("base64,") + 7);
    const w = await Filesystem.writeFile({ path: fn, data: b64, directory: Directory.Cache });
    try {
      await Share.share({ dialogTitle: "Enviar checklist", files: [w.uri] });
      return "shared";
    } catch (e) {
      if (/cancel/i.test(String((e && e.message) || e))) return "cancelled";
      throw e;
    }
  }
  const blob = doc.output("blob");
  const file = new File([blob], fn, { type: "application/pdf" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) return pdfPronto(file, blob, fn);
  baixarPdf(blob, fn);
  return "downloaded";
}

function baixarPdf(blob, fn) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = fn; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/* Celular (navegador/PWA): mostra "PDF pronto" e o toque em Enviar abre o WhatsApp/compartilhar. */
function pdfPronto(file, blob, fn) {
  return new Promise(resolve => {
    const ov = document.createElement("div");
    ov.style.cssText = "position:fixed;inset:0;z-index:99;background:rgba(26,18,14,.55);display:flex;align-items:flex-end;justify-content:center;padding:16px";
    ov.innerHTML = '<div style="background:#FCFAF6;border-radius:18px;padding:18px;width:100%;max-width:440px;margin-bottom:env(safe-area-inset-bottom)">'
      + '<h3 style="margin:0 0 6px;font-size:17px;color:#1A120E">PDF pronto</h3>'
      + '<p style="margin:0 0 16px;color:#7A6E64">Toque em <b>Enviar</b> e escolha o WhatsApp.</p>'
      + '<button class="btn pri" data-x="enviar" style="width:100%;margin-bottom:8px">Enviar pelo WhatsApp</button>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      + '<button class="btn sec" data-x="salvar">Salvar no celular</button>'
      + '<button class="btn sec" data-x="fechar">Fechar</button></div></div>';
    const fim = r => { ov.remove(); resolve(r); };
    ov.addEventListener("click", async e => {
      const x = e.target.closest("[data-x]")?.dataset.x;
      if (!x) { if (e.target === ov) fim("cancelled"); return; }
      if (x === "fechar") return fim("cancelled");
      if (x === "salvar") { baixarPdf(blob, fn); return fim("downloaded"); }
      try { await navigator.share({ files: [file] }); fim("shared"); }
      catch (err) { if (err && err.name === "AbortError") return; baixarPdf(blob, fn); fim("downloaded"); }
    });
    document.body.appendChild(ov);
  });
}

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { EMPRESA, MARCA, CHECKLISTS, STATUS } from "./config.js";

function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
export function fmtDate(iso) { if (!iso) return "—"; const [y, m, d] = iso.split("-"); return d + "/" + m + "/" + y; }
function nowHM() { return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }

/** Gera o PDF (mesmo layout do HTML original). Retorna o objeto jsPDF. */
export function buildPdf(tipo, s, c, items) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 12; const fim = nowHM();
  const COFFEE = hex("#3A2418"), INK = hex("#1A120E"), BROWN = hex("#6B4A2E"), SAND = hex("#A88462"), CREAM = hex("#D5C4AE"), GRAY = hex("#4A4A46");
  const OK = hex("#3F7A4A"), NC = hex("#B3402F"), LIGHT = hex("#F3EDE4");

  // Cabeçalho
  doc.setFillColor(...INK); doc.rect(0, 0, W, 30, "F");
  doc.setFillColor(...SAND); doc.rect(0, 30, W, 1.2, "F");
  doc.setTextColor(...SAND); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
  doc.text(EMPRESA.toUpperCase() + "  •  " + s.loja.toUpperCase(), M, 11);
  doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.text(CHECKLISTS[tipo].titulo.toUpperCase(), M, 21);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...CREAM);
  doc.text("Data: " + fmtDate(s.data), W - M, 13, { align: "right" });
  doc.text("Início: " + (s.inicio || "—") + "   Conclusão: " + fim, W - M, 19, { align: "right" });

  // Identificação
  let y = 40;
  doc.setTextColor(...GRAY); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("RESPONSÁVEL", M, y);
  doc.setTextColor(...INK); doc.setFontSize(12); doc.text(s.nome.trim(), M, y + 6);

  // Resumo
  y = 53; const boxes = [
    ["Conformes", String(c.C), OK], ["Não conformes", String(c.NC), NC], ["Não se aplica", String(c.NA), GRAY],
    ["Sem resposta", String(c.pend), c.pend ? NC : GRAY], ["Conformidade", c.conf === null ? "—" : c.conf + "%", BROWN]
  ];
  const bw = (W - 2 * M - 4 * 3) / 5;
  boxes.forEach((b, i) => {
    const x = M + i * (bw + 3);
    doc.setFillColor(...LIGHT); doc.roundedRect(x, y, bw, 18, 2, 2, "F");
    doc.setFillColor(...b[2]); doc.rect(x, y, 1.4, 18, "F");
    doc.setTextColor(...b[2]); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(b[1], x + 5, y + 9);
    doc.setTextColor(...GRAY); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text(b[0], x + 5, y + 14.5);
  });

  // Tabela
  const body = []; let lastG = "";
  items.forEach(i => {
    if (i.grupo !== lastG) { lastG = i.grupo; body.push([{ content: i.grupo.toUpperCase(), colSpan: 5, styles: { fillColor: CREAM, textColor: INK, fontStyle: "bold", fontSize: 7.5 } }]); }
    const a = s.resp[i.id] || { s: "", obs: "", fotos: [] };
    body.push([String(i.n), i.t, a.s ? STATUS[a.s] : "Sem resposta", a.obs || "", a.fotos.length ? String(a.fotos.length) : ""]);
  });
  autoTable(doc, {
    startY: 77, margin: { left: M, right: M, bottom: 16 },
    head: [["#", "Item verificado", "Status", "Observação", "Fotos"]], body,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8, cellPadding: 1.8, lineColor: [228, 217, 203], lineWidth: .2, textColor: INK, valign: "middle" },
    headStyles: { fillColor: COFFEE, textColor: 255, fontStyle: "bold", fontSize: 8 },
    columnStyles: { 0: { cellWidth: 8, halign: "center" }, 1: { cellWidth: 82 }, 2: { cellWidth: 25, fontStyle: "bold" }, 3: { cellWidth: "auto" }, 4: { cellWidth: 11, halign: "center" } },
    didParseCell: (d) => {
      if (d.section === "body" && d.column.index === 2) {
        const v = d.cell.raw;
        if (v === "Conforme") d.cell.styles.textColor = OK; else if (v === "Não conforme") { d.cell.styles.textColor = NC; } else if (v === "Sem resposta") d.cell.styles.textColor = [160, 150, 140]; else d.cell.styles.textColor = GRAY;
      }
    }
  });
  y = doc.lastAutoTable.finalY + 8;

  // Pontos de atenção
  const ncs = items.filter(i => s.resp[i.id] && s.resp[i.id].s === "NC");
  if (ncs.length) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setTextColor(...NC); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Pontos de atenção (não conformidades)", M, y); y += 2;
    autoTable(doc, {
      startY: y + 2, margin: { left: M, right: M, bottom: 16 }, theme: "plain",
      body: ncs.map(i => [String(i.n), i.t, s.resp[i.id].obs || "Sem observação registrada"]),
      styles: { fontSize: 8, cellPadding: 1.8, textColor: INK },
      columnStyles: { 0: { cellWidth: 8, halign: "center", fontStyle: "bold", textColor: NC }, 1: { cellWidth: 80, fontStyle: "bold" }, 2: { cellWidth: "auto" } },
      alternateRowStyles: { fillColor: [247, 227, 223] }
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Evidências fotográficas
  const withPh = items.filter(i => s.resp[i.id] && s.resp[i.id].fotos.length);
  if (withPh.length) {
    doc.addPage(); y = 18;
    doc.setTextColor(...INK); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Evidências fotográficas", M, y); y += 8;
    const colW = (W - 2 * M - 6) / 2, maxH = 78;
    withPh.forEach(i => {
      const a = s.resp[i.id];
      const title = i.n + ". " + i.t; const lines = doc.splitTextToSize(title, W - 2 * M - 30);
      if (y + lines.length * 4.5 + 20 > 285) { doc.addPage(); y = 18; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...INK); doc.text(lines, M, y);
      const st = a.s ? STATUS[a.s] : "Sem resposta"; doc.setTextColor(...(a.s === "NC" ? NC : a.s === "C" ? OK : GRAY)); doc.text(st, W - M, y, { align: "right" });
      y += lines.length * 4.5 + 1.5;
      let col = 0, rowH = 0;
      a.fotos.forEach((f) => {
        const p = doc.getImageProperties(f); let w = colW, h = w * p.height / p.width; if (h > maxH) { h = maxH; w = h * p.width / p.height; }
        if (col === 0 && y + h > 285) { doc.addPage(); y = 18; }
        const x = M + col * (colW + 6) + (colW - w) / 2;
        doc.addImage(f, "JPEG", x, y, w, h, undefined, "FAST"); doc.setDrawColor(...CREAM); doc.setLineWidth(.3); doc.rect(x, y, w, h);
        rowH = Math.max(rowH, h); col++;
        if (col === 2) { col = 0; y += rowH + 5; rowH = 0; }
      });
      if (col !== 0) { y += rowH + 5; }
      y += 4;
    });
  }

  // Assinaturas
  if (y > 255) { doc.addPage(); y = 30; } else y += 14;
  doc.setDrawColor(...GRAY); doc.setLineWidth(.3);
  const sw = (W - 2 * M - 20) / 2;
  doc.line(M, y, M + sw, y); doc.line(M + sw + 20, y, W - M, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GRAY);
  doc.text(s.nome.trim() + " — Responsável", M + sw / 2, y + 4.5, { align: "center" });
  doc.text("Gestor / Prevenção de Perdas", M + sw + 20 + sw / 2, y + 4.5, { align: "center" });

  // Rodapé
  const pages = doc.getNumberOfPages(); const gerado = new Date().toLocaleString("pt-BR");
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p); doc.setFontSize(7); doc.setTextColor(150, 140, 130);
    doc.text(EMPRESA + " • " + CHECKLISTS[tipo].titulo + " • " + s.loja + " • " + fmtDate(s.data), M, 291);
    doc.text("Desenvolvido por " + MARCA, W / 2, 295, { align: "center" });
    doc.text("Gerado em " + gerado + "  •  Página " + p + " de " + pages, W - M, 291, { align: "right" });
  }
  return doc;
}

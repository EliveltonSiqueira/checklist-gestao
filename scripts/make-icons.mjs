// Gera os PNGs-base em /assets a partir de SVG (prancheta creme, prendedor areia, check marrom).
import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("assets", { recursive: true });

// Desenho da prancheta em coordenadas 0..100 (centralizado)
const clip = `
  <rect x="26" y="20" width="48" height="62" rx="6" fill="#D5C4AE"/>
  <rect x="38" y="14" width="24" height="14" rx="4" fill="#A88462"/>
  <rect x="44" y="10" width="12" height="8" rx="3" fill="#A88462"/>
  <path d="M37 53 L47 63 L65 42" fill="none" stroke="#6B4A2E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
`;
const svg = (size, scale, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  ${bg ? `<rect width="100" height="100" fill="#1A120E"/>` : ""}
  <g transform="translate(50 50) scale(${scale}) translate(-50 -46)">${clip}</g>
</svg>`;

const out = async (name, size, scale, bg) =>
  sharp(Buffer.from(svg(size, scale, bg))).png().toFile(`assets/${name}`);

await out("icon-only.png", 1024, 1.0, true);        // ícone completo
await out("icon-foreground.png", 1024, 0.62, false); // adaptive (zona segura)
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: "#1A120E" } }).png().toFile("assets/icon-background.png");
await out("icon.png", 1024, 1.0, true);
// splash 2732x2732: fundo escuro, ícone ao centro
const splashIcon = await sharp(Buffer.from(svg(900, 1.0, false))).png().toBuffer();
for (const n of ["splash.png", "splash-dark.png"]) {
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: "#1A120E" } })
    .composite([{ input: splashIcon, gravity: "center" }]).png().toFile(`assets/${n}`);
}
console.log("assets gerados");

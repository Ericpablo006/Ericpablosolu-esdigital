// Marca padrão (monograma "EP") desenhada em vetor. Usada no site (SVG) e nos PDFs.
// Para usar a logo oficial: envie o arquivo em Admin → Configurações → Logo.
export const BRAND = {
  hex: "M24 3 L42 13.5 V34.5 L24 45 L6 34.5 V13.5 Z",
  e: "M22 16 H14.5 V32 H22 M14.5 24 H21",
  p: "M27 32 V16 H31.5 A4.5 4.5 0 0 1 31.5 25 H27",
  viewBox: "0 0 48 48",
} as const;

export const BRAND_COLORS = {
  ink: "#05070d",
  navy: "#0a1633",
  neon: "#1d6bff",
  sky: "#5cb0ff",
  cyan: "#22d3ee",
  silver: "#c5cede",
} as const;

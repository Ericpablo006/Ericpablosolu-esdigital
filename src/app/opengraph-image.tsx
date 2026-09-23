import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/settings";

export const alt = "Eric Pablo Soluções Digitais";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const s = await getSettings();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#05070d 0%,#0a1633 55%,#1d6bff 160%)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="84" height="84" viewBox="0 0 48 48" fill="none">
            <path d="M24 3 L42 13.5 V34.5 L24 45 L6 34.5 V13.5 Z" fill="#05070d" stroke="#3b8bff" strokeWidth="2" strokeLinejoin="round" />
            <path d="M22 16 H14.5 V32 H22 M14.5 24 H21" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M27 32 V16 H31.5 A4.5 4.5 0 0 1 31.5 25 H27" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: "#c5cede" }}>{s.companyName}</div>
        </div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 82, fontWeight: 700, lineHeight: 1.05, maxWidth: 950 }}>{s.slogan}</div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 34, color: "#5cb0ff" }}>{s.tagline}</div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";
import { TICKET_PATH } from "@/components/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS applies its own corner mask, so the background fills the full square.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <svg viewBox="0 0 64 64" width="180" height="180">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff7a3d" />
              <stop offset="1" stopColor="#e3450d" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="url(#g)" />
          <path d={TICKET_PATH} fill="#fff" />
          <path d="M42 23V41" stroke="#e3450d" strokeWidth="2" strokeLinecap="round" strokeDasharray="0.5 4" />
        </svg>
      </div>
    ),
    size,
  );
}

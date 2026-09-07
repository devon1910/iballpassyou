import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "iBallPassYou",
    short_name: "iBallPassYou",
    description: "Casual football stats, clear leaderboards, and proper receipts.",
    start_url: "/",
    id: "/",
    display: "standalone",
    background_color: "#12140e",
    theme_color: "#12140e",
    orientation: "portrait",
    icons: [{ src: "/brand/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" }, { src: "/brand/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" }, { src: "/brand/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" }],
  };
}

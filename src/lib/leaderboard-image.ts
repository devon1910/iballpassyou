import type { LeaderboardPeriod, LeaderboardRow } from "@/types/domain";

export function leaderboardImagePages(rows: LeaderboardRow[]) {
  return Array.from({ length: Math.ceil(rows.length / 10) }, (_, index) => rows.slice(index * 10, index * 10 + 10));
}

export function leaderboardPeriodLabel(period: LeaderboardPeriod, timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "numeric", timeZone: timezone }).formatToParts(now);
  const year = Number(parts.find(p => p.type === "year")!.value);
  const month = Number(parts.find(p => p.type === "month")!.value);
  if (period === "all") return "All time";
  if (period === "year") return String(year);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - (period === "last_month" ? 2 : 1), 1)));
}

export interface LeaderboardImageData {
  groupName: string;
  periodLabel: string;
  snapshotDate: string;
  rows: LeaderboardRow[];
}

export function drawLeaderboardImage(canvas: HTMLCanvasElement, data: LeaderboardImageData, rows: LeaderboardRow[], page: number, pageCount: number) {
  canvas.width = 1080; canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  const paper = "#f4f3ec", lime = "#d6f531", ink = "#12140e", muted = "#b5b8aa";
  function text(value: string, x: number, y: number, size: number, color = paper, weight = 600, width?: number, align: CanvasTextAlign = "left") {
    ctx!.textAlign = align;
    ctx!.font = `${weight} ${size}px "Archivo Variable", Helvetica, Arial, sans-serif`;
    while (width && ctx!.measureText(value).width > width && size > 16) {
      size--; ctx!.font = `${weight} ${size}px "Archivo Variable", Helvetica, Arial, sans-serif`;
    }
    if (width && ctx!.measureText(value).width > width) {
      while (value.length && ctx!.measureText(`${value}…`).width > width) value = value.slice(0, -1);
      value += "…";
    }
    ctx!.fillStyle = color; ctx!.fillText(value, x, y);
  }
  ctx.fillStyle = ink; ctx.fillRect(0, 0, 1080, 1440);
  const glow = ctx.createLinearGradient(0, 0, 1080, 650);
  glow.addColorStop(0, "#303a1b"); glow.addColorStop(1, ink);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 1080, 650);
  ctx.fillStyle = lime; ctx.fillRect(72, 72, 52, 7);
  text("THE GROUP STANDINGS", 72, 132, 24, lime);
  text(data.groupName.toUpperCase(), 72, 234, 78, paper, 800, 936);
  text(data.periodLabel.toUpperCase(), 72, 300, 29, lime, 700, 640);
  text(`${data.rows.length} PLAYERS`, 1008, 300, 22, muted, 500, 270, "right");

  text("#", 108, 380, 21, muted);
  text("PLAYER", 190, 380, 21, muted);
  text("GOALS", 697, 380, 20, muted, 600, undefined, "right");
  text("ASSISTS", 827, 380, 20, muted, 600, undefined, "right");
  text("RATING", 973, 380, 20, muted, 600, undefined, "right");
  rows.forEach((row, index) => {
    const y = 408 + index * 77;
    const top = row.rank === 1;
    ctx.fillStyle = top ? lime : index % 2 === 0 ? "#1e2217" : "#171a12";
    ctx.fillRect(72, y, 936, 72);
    const color = top ? ink : paper;
    text(String(row.rank), 108, y + 47, 27, top ? ink : muted, 700, 58);
    text(row.name, 190, y + 47, 30, color, 700, 360);
    text(String(row.goals), 697, y + 47, 27, color, 600, 100, "right");
    text(String(row.assists), 827, y + 47, 27, color, 600, 100, "right");
    text(String(row.rating), 973, y + 49, 35, top ? ink : lime, 800, 120, "right");
  });
  text("Goal +4  ·  Assist +2  ·  Session win +1", 72, 1230, 23, muted, 500);
  text(`AS OF ${data.snapshotDate.toUpperCase()}`, 72, 1273, 20, muted, 500);
  text(`CARD ${page + 1} / ${pageCount}`, 1008, 1273, 20, muted, 500, undefined, "right");
  ctx.fillStyle = "#363d29"; ctx.fillRect(72, 1305, 936, 1);
  text("iballpassyou", 72, 1373, 43, paper, 800);
  text("SEE WHO BALL PASS ↗", 1008, 1373, 23, lime, 600, undefined, "right");
}

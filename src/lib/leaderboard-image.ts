import {
  CONTENT_LEFT,
  CONTENT_RIGHT,
  drawReceiptBarcode,
  drawReceiptDocket,
  drawReceiptFooter,
  drawReceiptGround,
  drawReceiptMasthead,
  drawReceiptRule,
  drawReceiptText,
  fitReceiptText,
  OG_SIZE,
  RECEIPT_COLORS,
  RECEIPT_SIZE,
  STORY_SIZE,
  type ReceiptBaseData,
} from "@/lib/receipt-image";
import type { LeaderboardPeriod, LeaderboardRow } from "@/types/domain";

/**
 * Kept for source compatibility with older callers. Share cards themselves
 * use leaderboardCardRows and never paginate.
 */
export function leaderboardImagePages(rows: LeaderboardRow[]) {
  return Array.from({ length: Math.ceil(rows.length / 10) }, (_, index) => rows.slice(index * 10, index * 10 + 10));
}

export function leaderboardCardRows(rows: LeaderboardRow[]) {
  return rows.slice(0, 6);
}

export function leaderboardPeriodLabel(period: LeaderboardPeriod, timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "numeric", timeZone: timezone }).formatToParts(now);
  const year = Number(parts.find(p => p.type === "year")!.value);
  const month = Number(parts.find(p => p.type === "month")!.value);
  if (period === "all") return "All time";
  if (period === "year") return String(year);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - (period === "last_month" ? 2 : 1), 1)));
}

export interface LeaderboardImageData extends ReceiptBaseData {
  periodLabel: string;
  snapshotDate: string;
  rows: LeaderboardRow[];
}

function drawTableReceipt(ctx: CanvasRenderingContext2D, data: LeaderboardImageData) {
  drawReceiptGround(ctx);
  drawReceiptMasthead(ctx, data);
  drawReceiptDocket(ctx, data, data.periodLabel.toUpperCase());
  drawReceiptRule(ctx, 268);

  const rows = leaderboardCardRows(data.rows);
  drawReceiptText(ctx, "RANK", CONTENT_LEFT, 327, 18, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace');
  drawReceiptText(ctx, "PLAYER", 190, 327, 18, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace');
  drawReceiptText(ctx, "STAT LINE", 742, 327, 18, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace', "right");
  drawReceiptText(ctx, "PTS", CONTENT_RIGHT, 327, 18, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace', "right");

  rows.forEach((row, index) => {
    const y = 390 + index * 89;
    const top = row.rank === 1;
    drawReceiptText(ctx, String(row.rank).padStart(2, "0"), CONTENT_LEFT, y, 24, top ? RECEIPT_COLORS.lime : RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace');
    fitReceiptText(ctx, row.name, 420, 34, 20, RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', 190, y);
    drawReceiptText(ctx, `${row.goals}G ${row.assists}A · ${row.rating}`, 742, y, 18, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace', "right");
    drawReceiptText(ctx, String(row.rating), CONTENT_RIGHT, y, 30, top ? RECEIPT_COLORS.lime : RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', "right");
    drawReceiptRule(ctx, y + 32);
  });

  if (data.rows.length > rows.length) drawReceiptText(ctx, `+ ${data.rows.length - rows.length} MORE AT IBALLPASSYOU.COM/${data.groupSlug || "GROUP"}`, CONTENT_LEFT, 968, 18, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace');
  drawReceiptRule(ctx, 1040, true);
  drawReceiptBarcode(ctx, data);
  drawReceiptFooter(ctx, data);
}

/** Draw the 1080×1350 top-six table receipt. */
export function drawLeaderboardImage(canvas: HTMLCanvasElement, data: LeaderboardImageData, _rows = data.rows, _page = 0, _pageCount = 1) {
  canvas.width = RECEIPT_SIZE.width;
  canvas.height = RECEIPT_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  drawTableReceipt(ctx, data);
}

/** Draw the 1080×1920 story crop with the same top-six content. */
export function drawLeaderboardStoryImage(canvas: HTMLCanvasElement, data: LeaderboardImageData) {
  canvas.width = STORY_SIZE.width;
  canvas.height = STORY_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  drawReceiptGround(ctx, STORY_SIZE.width, STORY_SIZE.height);
  ctx.save();
  ctx.translate(0, 320);
  ctx.scale(1, 1320 / RECEIPT_SIZE.height);
  drawTableReceipt(ctx, data);
  ctx.restore();
}

/** Draw the 1200×630 OG table crop: masthead, table subject, top points and footer. */
export function drawLeaderboardOgImage(canvas: HTMLCanvasElement, data: LeaderboardImageData) {
  canvas.width = OG_SIZE.width;
  canvas.height = OG_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  drawReceiptGround(ctx, OG_SIZE.width, OG_SIZE.height);
  const left = 76;
  const right = OG_SIZE.width - 76;
  drawReceiptText(ctx, "iballpassyou", left, 77, 34, RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif');
  drawReceiptText(ctx, "KEEP THE RECEIPTS", right, 77, 17, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace', "right");
  ctx.strokeStyle = RECEIPT_COLORS.paper; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(left, 108); ctx.lineTo(right, 108); ctx.stroke();
  fitReceiptText(ctx, data.groupName, right - left, 74, 30, RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', left, 258);
  drawReceiptText(ctx, data.periodLabel.toUpperCase(), left, 303, 18, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace');
  const winner = leaderboardCardRows(data.rows)[0];
  if (winner) drawReceiptText(ctx, String(winner.rating), right, 303, 72, winner.rank === 1 ? RECEIPT_COLORS.lime : RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', "right");
  drawReceiptText(ctx, `IBALLPASSYOU.COM/${data.groupSlug || "GROUP"}`, left, 584, 17, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace');
  if (data.sessionNumber !== undefined) drawReceiptText(ctx, `NO. ${String(data.sessionNumber).padStart(4, "0")}`, right, 584, 17, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace', "right");
}

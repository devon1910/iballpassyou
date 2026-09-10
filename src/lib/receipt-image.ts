import { RATING } from "@/lib/config";
import { drawCode128B } from "@/lib/barcode";

export const RECEIPT_COLORS = {
  ink: "#12140E",
  paper: "#F4F3EC",
  secondary: "#9DA294",
  row: "#23261C",
  dashed: "#3A3E32",
  lime: "#D6F531",
} as const;

export const RECEIPT_SIZE = { width: 1080, height: 1350 } as const;
export const STORY_SIZE = { width: 1080, height: 1920 } as const;
export const OG_SIZE = { width: 1200, height: 630 } as const;

export interface ReceiptBaseData {
  groupName: string;
  groupSlug?: string;
  barcodeValue?: string;
  venue?: string;
  date?: string;
  sessionNumber?: number;
}

const DISPLAY_FONT = '"Archivo Variable", Helvetica, Arial, sans-serif';
const MONO_FONT = '"IBM Plex Mono", ui-monospace, monospace';
export const CONTENT_LEFT = 76;
export const CONTENT_RIGHT = 1004;
export const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;

export function receiptBarcodeValue(data: Pick<ReceiptBaseData, "groupSlug" | "barcodeValue">) {
  return data.barcodeValue ?? `https://iballpassyou.com/groups/${data.groupSlug || "group"}`;
}

export function drawReceiptGround(ctx: CanvasRenderingContext2D, width: number = RECEIPT_SIZE.width, height: number = RECEIPT_SIZE.height) {
  ctx.fillStyle = RECEIPT_COLORS.ink;
  ctx.fillRect(0, 0, width, height);
}

export function drawReceiptText(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string = RECEIPT_COLORS.paper,
  weight = 400,
  family = MONO_FONT,
  align: CanvasTextAlign = "left",
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, x, y);
  ctx.restore();
}

export function fitReceiptText(
  ctx: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  preferredSize: number,
  minSize: number,
  color: string = RECEIPT_COLORS.paper,
  weight = 800,
  family = DISPLAY_FONT,
  x = CONTENT_LEFT,
  y = 0,
  align: CanvasTextAlign = "left",
) {
  let size = preferredSize;
  ctx.save();
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(value).width > maxWidth && size > minSize) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  ctx.restore();
  drawReceiptText(ctx, value, x, y, size, color, weight, family, align);
  return size;
}

export function drawReceiptRule(ctx: CanvasRenderingContext2D, y: number, hard = false) {
  ctx.save();
  ctx.strokeStyle = hard ? RECEIPT_COLORS.paper : RECEIPT_COLORS.dashed;
  ctx.lineWidth = hard ? 2 : 1;
  if (!hard) ctx.setLineDash([3, 7]);
  ctx.beginPath();
  ctx.moveTo(CONTENT_LEFT, y);
  ctx.lineTo(CONTENT_RIGHT, y);
  ctx.stroke();
  ctx.restore();
}

export function drawReceiptMasthead(ctx: CanvasRenderingContext2D, base: ReceiptBaseData, yOffset = 0) {
  fitReceiptText(ctx, "iballpassyou", CONTENT_WIDTH * 0.46, 39, 24, RECEIPT_COLORS.paper, 800, DISPLAY_FONT, CONTENT_LEFT, 106 + yOffset);
  drawReceiptText(ctx, "KEEP THE RECEIPTS", CONTENT_RIGHT, 106 + yOffset, 20, RECEIPT_COLORS.secondary, 400, MONO_FONT, "right");
  drawReceiptRule(ctx, 140 + yOffset, true);
}

function dayLabel(date: string) {
  return date;
}

export function drawReceiptDocket(ctx: CanvasRenderingContext2D, data: ReceiptBaseData, subtitle?: string, yOffset = 0) {
  drawReceiptText(ctx, data.groupName, CONTENT_LEFT, 190 + yOffset, 24, RECEIPT_COLORS.paper, 400, MONO_FONT);
  if (data.sessionNumber !== undefined) drawReceiptText(ctx, `SESSION ${String(data.sessionNumber).padStart(2, "0")}`, CONTENT_RIGHT, 190 + yOffset, 24, RECEIPT_COLORS.paper, 400, MONO_FONT, "right");
  drawReceiptText(ctx, data.venue || subtitle || "WHAT HAPPENED", CONTENT_LEFT, 230 + yOffset, 22, RECEIPT_COLORS.secondary, 400, MONO_FONT);
  if (data.date) drawReceiptText(ctx, dayLabel(data.date), CONTENT_RIGHT, 230 + yOffset, 22, RECEIPT_COLORS.secondary, 400, MONO_FONT, "right");
  drawReceiptRule(ctx, 268 + yOffset);
}

export function drawReceiptStamp(ctx: CanvasRenderingContext2D, label: string, y: number) {
  const tracking = 0.22;
  const size = 20;
  ctx.save();
  ctx.font = `400 ${size}px ${MONO_FONT}`;
  const width = ctx.measureText(label).width + size * tracking * Math.max(0, label.length - 1) + 32;
  ctx.fillStyle = RECEIPT_COLORS.lime;
  ctx.fillRect(CONTENT_LEFT, y, width, 49);
  ctx.restore();
  drawTrackedReceiptText(ctx, label, CONTENT_LEFT + 16, y + 33, size, RECEIPT_COLORS.ink, tracking);
  return width;
}

export function drawTrackedReceiptText(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string = RECEIPT_COLORS.secondary,
  tracking = 0.12,
  align: CanvasTextAlign = "left",
) {
  // Canvas has no letter-spacing primitive. Drawing each glyph keeps the
  // mono receipt labels faithful at export sizes and in the live preview.
  const spacing = size * tracking;
  const characters = [...value];
  const widths = characters.map((character) => {
    ctx.save();
    ctx.font = `400 ${size}px ${MONO_FONT}`;
    const width = ctx.measureText(character).width;
    ctx.restore();
    return width;
  });
  const total = widths.reduce((sum, width) => sum + width, 0) + spacing * Math.max(0, characters.length - 1);
  let cursor = align === "right" ? x - total : align === "center" ? x - total / 2 : x;
  characters.forEach((character, index) => {
    drawReceiptText(ctx, character, cursor, y, size, color, 400, MONO_FONT);
    cursor += widths[index] + spacing;
  });
}

export function drawReceiptFooter(ctx: CanvasRenderingContext2D, data: ReceiptBaseData, yOffset = 0) {
  drawReceiptText(ctx, `IBALLPASSYOU.COM/${data.groupSlug || "GROUP"}`, CONTENT_LEFT, 1268 + yOffset, 20, RECEIPT_COLORS.secondary, 400, MONO_FONT);
  if (data.sessionNumber !== undefined) drawReceiptText(ctx, `NO. ${String(data.sessionNumber).padStart(4, "0")}`, CONTENT_RIGHT, 1268 + yOffset, 20, RECEIPT_COLORS.secondary, 400, MONO_FONT, "right");
}

export function drawReceiptBarcode(ctx: CanvasRenderingContext2D, data: ReceiptBaseData, y = 1118, height = 92, yOffset = 0) {
  drawCode128B(ctx, receiptBarcodeValue(data), CONTENT_LEFT, y + yOffset, CONTENT_WIDTH, height, RECEIPT_COLORS.paper);
}

export function drawReceiptTotal(ctx: CanvasRenderingContext2D, points: number, y = 924) {
  drawReceiptText(ctx, "TOTAL", CONTENT_LEFT, y, 25, RECEIPT_COLORS.paper, 400, MONO_FONT);
  drawReceiptText(ctx, String(points), CONTENT_RIGHT, y + 10, 92, RECEIPT_COLORS.lime, 800, DISPLAY_FONT, "right");
}

export function drawReceiptLineItems(
  ctx: CanvasRenderingContext2D,
  items: Array<{ label: string; quantity: number; rate: number; subtotal: number }>,
  startY = 674,
) {
  items.forEach((item, index) => {
    const y = startY + index * 57;
    drawReceiptText(ctx, item.label, CONTENT_LEFT, y, 24, RECEIPT_COLORS.paper, 400, MONO_FONT);
    drawReceiptText(ctx, `${item.quantity} × ${item.rate}`, 832, y, 23, RECEIPT_COLORS.secondary, 400, MONO_FONT, "right");
    drawReceiptText(ctx, `${item.subtotal} PTS`, CONTENT_RIGHT, y, 23, RECEIPT_COLORS.paper, 400, MONO_FONT, "right");
  });
}

export function receiptItems(goals: number, assists: number, wins: number) {
  const items: Array<{ label: string; quantity: number; rate: number; subtotal: number } | undefined> = [
    goals > 0 ? { label: "GOALS", quantity: goals, rate: RATING.GOAL, subtotal: goals * RATING.GOAL } : undefined,
    assists > 0 ? { label: "ASSISTS", quantity: assists, rate: RATING.ASSIST, subtotal: assists * RATING.ASSIST } : undefined,
    wins > 0 ? { label: "WIN", quantity: wins, rate: RATING.SESSION_WIN, subtotal: wins * RATING.SESSION_WIN } : undefined,
  ];
  return items.filter((item): item is { label: string; quantity: number; rate: number; subtotal: number } => Boolean(item));
}

export function drawReceiptOgGround(ctx: CanvasRenderingContext2D) {
  drawReceiptGround(ctx, OG_SIZE.width, OG_SIZE.height);
}

export function drawReceiptOgFooter(ctx: CanvasRenderingContext2D, data: ReceiptBaseData) {
  drawReceiptText(ctx, `IBALLPASSYOU.COM/${data.groupSlug || "GROUP"}`, CONTENT_LEFT, 584, 17, RECEIPT_COLORS.secondary, 400, MONO_FONT);
  drawReceiptText(ctx, `NO. ${String(data.sessionNumber ?? 0).padStart(4, "0")}`, OG_SIZE.width - CONTENT_LEFT, 584, 17, RECEIPT_COLORS.secondary, 400, MONO_FONT, "right");
}

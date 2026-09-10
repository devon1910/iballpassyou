import {
  CONTENT_LEFT,
  CONTENT_RIGHT,
  CONTENT_WIDTH,
  drawReceiptBarcode,
  drawReceiptDocket,
  drawReceiptFooter,
  drawReceiptGround,
  drawReceiptMasthead,
  drawReceiptRule,
  drawReceiptStamp,
  drawReceiptText,
  fitReceiptText,
  OG_SIZE,
  RECEIPT_COLORS,
  RECEIPT_SIZE,
  STORY_SIZE,
  type ReceiptBaseData,
} from "@/lib/receipt-image";

export interface SessionAchievementRecord {
  playerName: string;
  points?: number;
  goals?: number;
  assists?: number;
  clause?: string;
}
export interface SessionAchievementImageData extends ReceiptBaseData {
  date: string;
  motm: {
    names: string | string[];
    points?: number;
    goals?: number;
    assists?: number;
    rating?: number | string;
  };
  records: SessionAchievementRecord[];
}

export const SESSION_ACHIEVEMENT_IMAGE_SIZE = RECEIPT_SIZE;

function motmNames(data: SessionAchievementImageData) {
  return Array.isArray(data.motm.names) ? data.motm.names : [data.motm.names];
}

function drawSessionReceipt(ctx: CanvasRenderingContext2D, data: SessionAchievementImageData) {
  drawReceiptGround(ctx);
  drawReceiptMasthead(ctx, data);
  drawReceiptDocket(ctx, data, "WHAT HAPPENED");
  drawReceiptStamp(ctx, "MAN OF THE MATCH", 304);

  const names = motmNames(data);
  const preferredSize = names.length > 1 ? 110 : 132;
  const nameWidth = CONTENT_WIDTH - 250;
  const fitted = names.map((name) => {
    let size = preferredSize;
    ctx.save();
    ctx.font = `800 ${size}px "Archivo Variable", Helvetica, Arial, sans-serif`;
    while (ctx.measureText(name).width > nameWidth && size > 38) {
      size -= 1;
      ctx.font = `800 ${size}px "Archivo Variable", Helvetica, Arial, sans-serif`;
    }
    ctx.restore();
    return size;
  });
  const nameSize = Math.min(...fitted);
  names.forEach((name, index) => fitReceiptText(ctx, name, nameWidth, nameSize, 38, RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', CONTENT_LEFT, 452 + index * (nameSize + 8)));
  if (data.motm.points !== undefined) drawReceiptText(ctx, String(data.motm.points), CONTENT_RIGHT, names.length > 1 ? 480 : 468, 80, RECEIPT_COLORS.lime, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', "right");
  const stats = [
    data.motm.goals !== undefined ? `${data.motm.goals}G` : undefined,
    data.motm.assists !== undefined ? `${data.motm.assists}A` : undefined,
    data.motm.rating !== undefined ? `RATING ${data.motm.rating}` : undefined,
  ].filter((item): item is string => Boolean(item));
  if (stats.length) drawReceiptText(ctx, stats.join(" · "), CONTENT_LEFT, 526 + (names.length - 1) * (nameSize + 8), 21, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace');

  const sectionRuleY = 574 + (names.length - 1) * (nameSize + 8);
  drawReceiptRule(ctx, sectionRuleY);
  if (data.records.length) {
    drawReceiptText(ctx, "ALSO ON THE RECEIPT", CONTENT_LEFT, sectionRuleY + 50, 20, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace');
    data.records.slice(0, 4).forEach((record, index) => {
      const y = sectionRuleY + 126 + index * 80;
      fitReceiptText(ctx, record.playerName, CONTENT_LEFT, 58, 28, RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', CONTENT_LEFT, y);
      if (record.clause) drawReceiptText(ctx, record.clause, CONTENT_RIGHT, y, 19, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace', "right");
      drawReceiptRule(ctx, y + 36);
    });
  }

  const barcodeY = 1118;
  drawReceiptRule(ctx, data.records.length ? 1040 : 670, true);
  drawReceiptBarcode(ctx, data, barcodeY);
  drawReceiptFooter(ctx, data);
}

/** Draw the 1080×1350 session receipt master. */
export function drawSessionAchievementImage(canvas: HTMLCanvasElement, data: SessionAchievementImageData) {
  canvas.width = RECEIPT_SIZE.width;
  canvas.height = RECEIPT_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  drawSessionReceipt(ctx, data);
}

/** Draw the 1080×1920 story crop with 320px/280px dead zones. */
export function drawSessionAchievementStoryImage(canvas: HTMLCanvasElement, data: SessionAchievementImageData) {
  canvas.width = STORY_SIZE.width;
  canvas.height = STORY_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  drawReceiptGround(ctx, STORY_SIZE.width, STORY_SIZE.height);
  ctx.save();
  ctx.translate(0, 320);
  ctx.scale(1, 1320 / RECEIPT_SIZE.height);
  drawSessionReceipt(ctx, data);
  ctx.restore();
}

/** Draw the 1200×630 OG crop without line items or barcode. */
export function drawSessionAchievementOgImage(canvas: HTMLCanvasElement, data: SessionAchievementImageData) {
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
  ctx.save(); ctx.translate(0, -159); drawReceiptStamp(ctx, "MAN OF THE MATCH", 304); ctx.restore();
  const name = motmNames(data).join(" / ");
  fitReceiptText(ctx, name, right - left - 250, 86, 30, RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', left, 280);
  if (data.motm.points !== undefined) drawReceiptText(ctx, String(data.motm.points), right, 350, 76, RECEIPT_COLORS.lime, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', "right");
  drawReceiptText(ctx, data.groupName, left, 350, 18, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace');
  drawReceiptText(ctx, `IBALLPASSYOU.COM/${data.groupSlug || "GROUP"}`, left, 584, 17, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace');
  if (data.sessionNumber !== undefined) drawReceiptText(ctx, `NO. ${String(data.sessionNumber).padStart(4, "0")}`, right, 584, 17, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace', "right");
}

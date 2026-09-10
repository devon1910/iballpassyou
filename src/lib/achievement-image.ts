import {
  CONTENT_WIDTH,
  drawReceiptBarcode,
  drawReceiptDocket,
  drawReceiptFooter,
  drawReceiptGround,
  drawReceiptLineItems,
  drawReceiptMasthead,
  drawReceiptRule,
  drawReceiptStamp,
  drawReceiptText,
  drawReceiptTotal,
  fitReceiptText,
  OG_SIZE,
  RECEIPT_COLORS,
  RECEIPT_SIZE,
  receiptItems,
  STORY_SIZE,
  type ReceiptBaseData,
} from "@/lib/receipt-image";

export interface AchievementRecord {
  format: string;
  points: number;
  goals: number;
  assists: number;
  date: string;
}
/**
 * Legacy fields are retained for callers that still open a player share
 * preview. Optional receipt fields let session MOTM cards carry every fact
 * without fabricating missing values.
 */
export interface AchievementImageData extends ReceiptBaseData {
  playerName: string;
  motm: number;
  mvp: number;
  records: AchievementRecord[];
  names?: string[];
  points?: number;
  goals?: number;
  assists?: number;
  wins?: number;
  rating?: number | string;
  rank?: number;
  playerCount?: number;
  seasonBest?: boolean;
}

export const ACHIEVEMENT_IMAGE_SIZE = RECEIPT_SIZE;

function normaliseNames(data: AchievementImageData) {
  return data.names?.length ? data.names : [data.playerName];
}

function drawMotmReceipt(ctx: CanvasRenderingContext2D, data: AchievementImageData, record?: AchievementRecord) {
  drawReceiptGround(ctx);
  drawReceiptMasthead(ctx, data);
  drawReceiptDocket(ctx, data, "GREENFIELD PITCH");
  drawReceiptStamp(ctx, "MAN OF THE MATCH", 304);

  const names = normaliseNames(data);
  const subjectSize = names.length > 1 ? 132 : 232;
  const availableNameWidth = CONTENT_WIDTH - 8;
  const measuredSizes = names.map((name) => {
    let size = subjectSize;
    ctx.save();
    ctx.font = `800 ${size}px "Archivo Variable", Helvetica, Arial, sans-serif`;
    while (ctx.measureText(name).width > availableNameWidth && size > 40) {
      size -= size > 180 ? 1 : 2;
      ctx.font = `800 ${size}px "Archivo Variable", Helvetica, Arial, sans-serif`;
    }
    ctx.restore();
    return size;
  });
  const size = Math.min(...measuredSizes);
  names.forEach((name, index) => fitReceiptText(ctx, name, availableNameWidth, size, 40, RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', 76, 555 + index * (size + 10)));
  drawReceiptRule(ctx, 614);

  const goals = data.goals ?? record?.goals ?? 0;
  const assists = data.assists ?? record?.assists ?? 0;
  const wins = data.wins ?? 0;
  drawReceiptLineItems(ctx, receiptItems(goals, assists, wins));
  drawReceiptRule(ctx, 825, true);

  const points = data.points ?? record?.points;
  if (points !== undefined) drawReceiptTotal(ctx, points);
  const meta = [
    data.rating !== undefined ? `RATING ${data.rating}` : undefined,
    data.rank !== undefined && data.playerCount !== undefined ? `RANK ${data.rank} / ${data.playerCount}` : undefined,
    data.seasonBest ? "SEASON BEST" : undefined,
  ].filter((item): item is string => Boolean(item));
  if (meta.length) {
    const positions = meta.length === 1 ? [76] : meta.length === 2 ? [76, 1004] : [76, 540, 1004];
    meta.forEach((item, index) => drawReceiptText(ctx, item, positions[index], 992, 20, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace', index === meta.length - 1 && meta.length > 1 ? "right" : "left"));
  }

  drawReceiptBarcode(ctx, data);
  drawReceiptFooter(ctx, data);
}

/** Draw the 1080×1350 MOTM receipt master. */
export function drawMotmReceiptImage(canvas: HTMLCanvasElement, data: AchievementImageData, record?: AchievementRecord) {
  canvas.width = RECEIPT_SIZE.width;
  canvas.height = RECEIPT_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  drawMotmReceipt(ctx, data, record);
}

/** Draw the 1080×1920 story variant, with the mandated dead zones. */
export function drawMotmReceiptStoryImage(canvas: HTMLCanvasElement, data: AchievementImageData, record?: AchievementRecord) {
  canvas.width = STORY_SIZE.width;
  canvas.height = STORY_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  drawReceiptGround(ctx, STORY_SIZE.width, STORY_SIZE.height);
  ctx.save();
  ctx.translate(0, 320);
  ctx.scale(1, 1320 / RECEIPT_SIZE.height);
  drawMotmReceipt(ctx, data, record);
  ctx.restore();
}

/** Draw the 1200×630 OG crop: masthead, stamp, subject, total and footer. */
export function drawMotmReceiptOgImage(canvas: HTMLCanvasElement, data: AchievementImageData, record?: AchievementRecord) {
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
  const names = normaliseNames(data);
  const joined = names.join(" / ");
  fitReceiptText(ctx, joined, right - left - 230, names.length > 1 ? 74 : 112, 30, RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', left, 280);
  const points = data.points ?? record?.points;
  if (points !== undefined) drawReceiptText(ctx, String(points), right, 348, 76, RECEIPT_COLORS.lime, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', "right");
  drawReceiptText(ctx, data.groupName, left, 350, 18, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace');
  drawReceiptText(ctx, `IBALLPASSYOU.COM/${data.groupSlug || "GROUP"}`, left, 584, 17, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace');
  if (data.sessionNumber !== undefined) drawReceiptText(ctx, `NO. ${String(data.sessionNumber).padStart(4, "0")}`, right, 584, 17, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace', "right");
}

/** Backwards-compatible name used by the existing share preview. */
export function drawAchievementImage(canvas: HTMLCanvasElement, data: AchievementImageData, record?: AchievementRecord) {
  drawMotmReceiptImage(canvas, data, record);
}

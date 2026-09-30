import {
  CONTENT_LEFT, CONTENT_RIGHT, CONTENT_WIDTH, drawReceiptBarcode, drawReceiptDocket,
  drawReceiptFooter, drawReceiptGround, drawReceiptMasthead, drawReceiptRule,
  drawReceiptStamp, drawReceiptText, fitReceiptText, OG_SIZE, RECEIPT_COLORS,
  RECEIPT_SIZE, STORY_SIZE, type ReceiptBaseData,
} from "@/lib/receipt-image";

export interface MonthlyMvpImageData extends ReceiptBaseData {
  month: string;
  winners: { name: string; goals: number; assists: number; wins: number }[];
  points: number;
}

function names(data: MonthlyMvpImageData) {
  return data.winners.map(winner => winner.name).join(" / ");
}

function drawReceipt(ctx: CanvasRenderingContext2D, data: MonthlyMvpImageData) {
  drawReceiptGround(ctx);
  drawReceiptMasthead(ctx, data);
  drawReceiptDocket(ctx, { ...data, date: data.month.toUpperCase() }, "MONTHLY HONOURS");
  drawReceiptStamp(ctx, "PLAYER OF THE MONTH", 304);
  fitReceiptText(ctx, names(data), CONTENT_WIDTH, data.winners.length > 1 ? 110 : 180, 40, RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', CONTENT_LEFT, 565);
  drawReceiptRule(ctx, 614);
  if (data.winners.length === 1) {
    const winner = data.winners[0];
    ([ ["GOALS", winner.goals], ["ASSISTS", winner.assists], ["SESSION WINS", winner.wins] ] as const).forEach(([label, value], index) => {
      const y = 681 + index * 58;
      drawReceiptText(ctx, label, CONTENT_LEFT, y, 24);
      drawReceiptText(ctx, String(value), CONTENT_RIGHT, y, 28, RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', "right");
    });
  } else {
    const visible = data.winners.slice(0, data.winners.length > 4 ? 3 : 4);
    visible.forEach((winner, index) => {
      const y = 665 + index * 43;
      fitReceiptText(ctx, winner.name, 440, 24, 16, RECEIPT_COLORS.paper, 400, '"IBM Plex Mono", ui-monospace, monospace', CONTENT_LEFT, y);
      drawReceiptText(ctx, `${winner.goals}G  ${winner.assists}A  ${winner.wins}W`, CONTENT_RIGHT, y, 23, RECEIPT_COLORS.paper, 400, '"IBM Plex Mono", ui-monospace, monospace', "right");
    });
    if (data.winners.length > 4) drawReceiptText(ctx, `+ ${data.winners.length - 3} MORE JOINT WINNERS`, CONTENT_LEFT, 794, 20, RECEIPT_COLORS.secondary);
  }
  drawReceiptRule(ctx, 825, true);
  drawReceiptText(ctx, "TOTAL POINTS", CONTENT_LEFT, 924, 25);
  drawReceiptText(ctx, String(data.points), CONTENT_RIGHT, 934, 92, RECEIPT_COLORS.lime, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', "right");
  drawReceiptBarcode(ctx, data);
  drawReceiptFooter(ctx, data);
}

export function drawMonthlyMvpImage(canvas: HTMLCanvasElement, data: MonthlyMvpImageData) {
  canvas.width = RECEIPT_SIZE.width;
  canvas.height = RECEIPT_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  drawReceipt(ctx, data);
}

export function drawMonthlyMvpStoryImage(canvas: HTMLCanvasElement, data: MonthlyMvpImageData) {
  canvas.width = STORY_SIZE.width;
  canvas.height = STORY_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  drawReceiptGround(ctx, STORY_SIZE.width, STORY_SIZE.height);
  ctx.save();
  ctx.translate(0, 320);
  ctx.scale(1, 1320 / RECEIPT_SIZE.height);
  drawReceipt(ctx, data);
  ctx.restore();
}

export function drawMonthlyMvpOgImage(canvas: HTMLCanvasElement, data: MonthlyMvpImageData) {
  canvas.width = OG_SIZE.width;
  canvas.height = OG_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  drawReceiptGround(ctx, OG_SIZE.width, OG_SIZE.height);
  drawReceiptText(ctx, "iballpassyou", CONTENT_LEFT, 77, 34, RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif');
  drawReceiptText(ctx, "KEEP THE RECEIPTS", OG_SIZE.width - CONTENT_LEFT, 77, 17, RECEIPT_COLORS.secondary, 400, '"IBM Plex Mono", ui-monospace, monospace', "right");
  drawReceiptRule(ctx, 108, true);
  drawReceiptStamp(ctx, "PLAYER OF THE MONTH", 145);
  fitReceiptText(ctx, names(data), OG_SIZE.width - CONTENT_LEFT * 2, 110, 32, RECEIPT_COLORS.paper, 800, '"Archivo Variable", Helvetica, Arial, sans-serif', CONTENT_LEFT, 330);
  drawReceiptText(ctx, data.month.toUpperCase(), CONTENT_LEFT, 403, 24, RECEIPT_COLORS.secondary);
  drawReceiptText(ctx, `${data.points} POINTS`, CONTENT_LEFT, 492, 58, RECEIPT_COLORS.lime, 800, '"Archivo Variable", Helvetica, Arial, sans-serif');
  const stats = data.winners.map(winner => `${winner.name}: ${winner.goals}G ${winner.assists}A ${winner.wins}W`).join(" / ");
  fitReceiptText(ctx, stats, OG_SIZE.width - CONTENT_LEFT * 2, 21, 14, RECEIPT_COLORS.paper, 400, '"IBM Plex Mono", ui-monospace, monospace', CONTENT_LEFT, 540);
  drawReceiptText(ctx, data.groupName, CONTENT_LEFT, 584, 19, RECEIPT_COLORS.secondary);
}

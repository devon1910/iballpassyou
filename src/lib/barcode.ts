/**
 * Code 128-B helpers used by the receipt cards.
 *
 * The reference artwork uses a placeholder bar pattern, but production cards
 * need a scannable value.  Keeping the encoder here means the canvas preview
 * and the downloaded PNG use exactly the same symbol sequence.
 */

// Code 128 symbols, expressed as alternating bar/space module widths.
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
] as const;

const START_CODE_B = 104;
const STOP_CODE = 106;

/** Return the Code 128-B symbol values, including start, checksum and stop. */
export function code128BValues(value: string): number[] {
  const symbols = [...value].map((character) => {
    const code = character.charCodeAt(0);
    if (code < 32 || code > 127) throw new Error("Code 128-B only supports printable ASCII text.");
    return code - 32;
  });
  const checksum = (START_CODE_B + symbols.reduce((sum, symbol, index) => sum + symbol * (index + 1), 0)) % 103;
  return [START_CODE_B, ...symbols, checksum, STOP_CODE];
}

/** Return the alternating module pattern for a Code 128-B value. */
export function code128BPattern(value: string): string {
  return code128BValues(value).map((symbol) => CODE128_PATTERNS[symbol]).join("");
}

/**
 * Draw a Code 128-B barcode with the first module as a bar. The background is
 * left untouched so the receipt's ink ground remains visible between bars.
 */
export function drawCode128B(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color = "#f4f3ec",
) {
  const pattern = code128BPattern(value);
  const moduleWidth = width / pattern.split("").reduce((total, module) => total + Number(module), 0);
  let cursor = x;
  ctx.save();
  ctx.fillStyle = color;
  for (let index = 0; index < pattern.length;) {
    const barWidth = Number(pattern[index]);
    if (index % 2 === 0) ctx.fillRect(cursor, y, barWidth * moduleWidth, height);
    cursor += barWidth * moduleWidth;
    index += 1;
  }
  ctx.restore();
}

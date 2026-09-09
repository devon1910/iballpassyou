export interface AchievementRecord {
  format: string;
  points: number;
  goals: number;
  assists: number;
  date: string;
}

export interface AchievementImageData {
  playerName: string;
  groupName: string;
  motm: number;
  mvp: number;
  records: AchievementRecord[];
}

export const ACHIEVEMENT_IMAGE_SIZE = { width: 1080, height: 1440 };

/** Draw the preview and exported PNG from the same canvas. No remote assets. */
export function drawAchievementImage(canvas: HTMLCanvasElement, data: AchievementImageData, record?: AchievementRecord) {
  canvas.width = ACHIEVEMENT_IMAGE_SIZE.width;
  canvas.height = ACHIEVEMENT_IMAGE_SIZE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  const ink = "#12140e", lime = "#d6f531", gold = "#e9bd62", paper = "#f4f3ec", muted = "#b5b8aa";
  const font = '"Archivo Variable", Helvetica, Arial, sans-serif';
  const mono = '"IBM Plex Mono", monospace';
  function text(value: string, x: number, y: number, size: number, color = paper, weight = 600, family = font) {
    ctx!.fillStyle = color;
    ctx!.font = `${weight} ${size}px ${family}`;
    ctx!.fillText(value, x, y);
  }
  function fit(value: string, x: number, y: number, width: number, size: number, color = paper) {
    let fitted = size;
    ctx!.font = `800 ${fitted}px ${font}`;
    while (ctx!.measureText(value).width > width && fitted > 12) {
      fitted -= 1;
      ctx!.font = `800 ${fitted}px ${font}`;
    }
    text(value, x, y, fitted, color, 800);
  }
  function name(value: string) {
    // Wrap long names (including names without spaces) before reducing the size.
    let size = 96;
    let lines: string[] = [];
    do {
      ctx!.font = `800 ${size}px ${font}`;
      lines = [""];
      for (const char of value.toUpperCase()) {
        const last = lines.length - 1;
        if (ctx!.measureText(lines[last] + char).width > 912) lines.push(char.trimStart());
        else lines[last] += char;
      }
      if (lines.length <= 2) break;
      size -= 2;
    } while (size > 12);
    lines.forEach((line, index) => text(line.trim(), 84, 300 + index * (size + 8), size, paper, 800));
  }
  function icon(kind: "medal" | "trophy", x: number, y: number) {
    ctx!.save();
    ctx!.translate(x, y);
    ctx!.scale(2.4, 2.4);
    ctx!.strokeStyle = gold;
    ctx!.lineWidth = 1.7;
    ctx!.lineCap = "round";
    ctx!.lineJoin = "round";
    const path = kind === "medal"
      ? "M8 14 3 5 6 2h12l3 3-5 9 M8 2l4 8 4-8 M7 17a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M12 15v4"
      : "M8 2h8v7a4 4 0 0 1-8 0Z M8 4H4v3a4 4 0 0 0 4 4 M16 4h4v3a4 4 0 0 1-4 4 M12 13v6 M8 22v-3h8v3 M6 22h12";
    ctx!.stroke(new Path2D(path));
    ctx!.restore();
  }

  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, 1080, 1440);
  const glow = ctx.createRadialGradient(1040, 0, 0, 1040, 0, 1150);
  glow.addColorStop(0, "#39421c"); glow.addColorStop(1, ink);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 1080, 1440);
  ctx.strokeStyle = "#363e24"; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(700 + i * 100, 0); ctx.lineTo(1080, 380 + i * 100); ctx.stroke();
  }
  ctx.fillStyle = lime; ctx.fillRect(84, 82, 54, 7);
  text("THE PLAYER FILE", 84, 152, 22, lime, 500, mono);
  text("CAREER HONOURS", 728, 152, 20, muted, 400, mono);
  name(data.playerName);
  fit(data.groupName, 84, 455, 912, 30, muted);

  [84, 552].forEach(x => {
    ctx.fillStyle = "#23251a"; ctx.fillRect(x, 510, 444, 222);
    ctx.strokeStyle = "#625431"; ctx.strokeRect(x, 510, 444, 222);
  });
  icon("medal", 114, 547); icon("trophy", 582, 547);
  fit(`×${data.motm}`, 208, 617, 284, 76, gold);
  fit(`×${data.mvp}`, 676, 617, 284, 76, gold);
  text("MAN OF THE MATCH", 114, 686, 23, paper, 500, mono);
  text("MONTHLY MVP", 582, 686, 23, paper, 500, mono);

  ctx.fillStyle = lime; ctx.fillRect(84, 776, 912, 444);
  if (record) {
    text("PERSONAL BEST", 120, 833, 25, ink, 500, mono);
    fit(record.format.toUpperCase(), 120, 883, 825, 24, "#475014");
    fit(String(record.points), 114, 1049, 630, 174, ink);
    text("POINTS", 761, 1049, 30, ink, 700);
    fit(`${record.goals} ${record.goals === 1 ? "goal" : "goals"}  /  ${record.assists} ${record.assists === 1 ? "assist" : "assists"}`, 120, 1120, 825, 37, ink);
    text(record.date, 120, 1176, 24, "#475014", 500, mono);
  } else {
    text("EVERY SESSION COUNTS.", 120, 893, 44, ink, 800);
    text("BUILD YOUR LEGACY.", 120, 956, 44, ink, 800);
    text("The next record is yours to chase.", 120, 1118, 28, ink, 500);
  }
  text("iballpassyou", 84, 1313, 43, paper, 800);
  ctx.fillStyle = lime; ctx.fillRect(359, 1290, 10, 10);
  text("YOUR GAME. YOUR NUMBERS.", 84, 1360, 19, muted, 400, mono);
  text("VIEW MY PLAYER PROFILE ↗", 643, 1359, 20, lime, 500, mono);
}

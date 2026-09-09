export interface SessionAchievementImageData { groupName: string; date: string; motm: { names: string; points: number }; records: { playerName: string; points: number; goals: number; assists: number }[]; }

export function drawSessionAchievementImage(canvas: HTMLCanvasElement, data: SessionAchievementImageData) {
  canvas.width = 1080; canvas.height = 1440;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Image creation is unavailable in this browser.");
  const ink="#12140e", lime="#d6f531", gold="#e9bd62", paper="#f4f3ec", muted="#b5b8aa"; const font='"Archivo Variable", Helvetica, Arial, sans-serif';
  const write=(v:string,x:number,y:number,s:number,c=paper,w=600,a:CanvasTextAlign="left")=>{ctx.fillStyle=c;ctx.font=`${w} ${s}px ${font}`;ctx.textAlign=a;ctx.fillText(v,x,y)};
  const fit=(v:string,x:number,y:number,max:number,s:number,c=paper)=>{let n=s;ctx.font=`800 ${n}px ${font}`;while(ctx.measureText(v).width>max&&n>14)n--;write(v,x,y,n,c,800)};
  ctx.fillStyle=ink;ctx.fillRect(0,0,1080,1440);const glow=ctx.createRadialGradient(1000,0,0,1000,0,1120);glow.addColorStop(0,"#39421c");glow.addColorStop(1,ink);ctx.fillStyle=glow;ctx.fillRect(0,0,1080,1440);ctx.fillStyle=lime;ctx.fillRect(84,82,54,7);
  write("SESSION RECEIPTS",84,152,23,lime,500);write(data.date.toUpperCase(),996,152,20,muted,500,"right");fit(data.groupName.toUpperCase(),84,260,912,72);write("THE STANDOUTS",84,318,22,muted,500);
  ctx.fillStyle="#23251a";ctx.fillRect(84,370,912,210);ctx.strokeStyle="#625431";ctx.strokeRect(84,370,912,210);write("MAN OF THE MATCH",124,425,22,gold,500);fit(data.motm.names,124,495,820,55);write(`${data.motm.points} POINTS`,124,540,21,muted,500);
  ctx.fillStyle=lime;ctx.fillRect(84,635,912,3);write("PERSONAL BESTS FROM THIS SESSION",84,694,22,lime,500);
  if(data.records.length) { const rowHeight=Math.min(66, Math.max(36, 500 / data.records.length)); data.records.forEach((r,i)=>{const y=735+i*rowHeight;ctx.fillStyle=i%2?"#171a12":"#1e2217";ctx.fillRect(84,y-rowHeight+8,912,rowHeight-4);fit(r.playerName,110,y,360,Math.min(26,rowHeight*.42));write(`${r.goals}G · ${r.assists}A`,610,y,Math.min(20,rowHeight*.32),muted,500,"right");write(`${r.points} PTS`,968,y,Math.min(25,rowHeight*.39),lime,800,"right")}); } else write("No personal bests were set this session.",110,790,27,muted,500);
  write("Goal +4 · Assist +2 · Session win +1",84,1320,20,muted,500);write("iballpassyou",84,1384,42,paper,800);write("KEEP THE RECEIPTS ↗",996,1384,21,lime,600,"right");
}

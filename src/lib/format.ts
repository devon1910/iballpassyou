import type { Group, LeaderboardRow, Schedule } from "@/types/domain";
export const WEEKDAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
export function formatTime(time:string){const [h,m]=time.split(":").map(Number);return `${h%12||12}${m?`:${String(m).padStart(2,"0")}`:""} ${h>=12?"PM":"AM"}`}
export function formatSchedule(schedule:Schedule){return `${WEEKDAYS[schedule.dayOfWeek-1]} · ${formatTime(schedule.kickoffTime)}${schedule.venue?` · ${schedule.venue}`:""}`}
export function shareText(group:Group,rows:LeaderboardRow[],period="SEPTEMBER"){const medals=["🥇","🥈","🥉"];const top=rows.slice(0,3).map((r,i)=>`${medals[i]} ${r.name}  ${r.rating} · ${r.goals}G ${r.assists}A`).join("\n");const line=rows[0]?`\n\n${rows[0].name} ball pass everybody this month.`:"";const path=group.publicSlug?`/groups/${group.publicSlug}`:`/g/${group.shareToken}`;return `${group.name.toUpperCase()} · ${period}\n\n${top}${line}\nFull table: iballpassyou.com${path}`}

import Link from "next/link";
import type { FootballSession } from "@/types/domain";
import { localDateInput } from "@/lib/time";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function SessionCalendar({ groupId, sessions, timezone, now = new Date() }: { groupId: string; sessions: FootballSession[]; timezone: string; now?: Date }) {
  const today = localDateInput(now, timezone);
  const [year, month] = today.split("-").map(Number);
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingDays = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: timezone }).format(now);
  const sessionsByDate = new Map<string, FootballSession[]>();

  for (const session of sessions) {
    const date = localDateInput(new Date(session.kickoffAt), timezone);
    if (!date.startsWith(monthKey)) continue;
    sessionsByDate.set(date, [...(sessionsByDate.get(date) ?? []), session]);
  }

  const monthlySessions = [...sessionsByDate.values()].reduce((total, daySessions) => total + daySessions.length, 0);

  return (
    <section className="session-calendar" aria-labelledby="session-calendar-title">
      <header className="calendar-head">
        <div><p className="section-label">Session calendar</p><h2 id="session-calendar-title">{monthLabel}</h2></div>
        <span>{monthlySessions} session{monthlySessions === 1 ? "" : "s"}</span>
      </header>
      <div className="calendar-grid calendar-weekdays" aria-hidden="true">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid calendar-days">
        {Array.from({ length: leadingDays }, (_, index) => <span className="calendar-blank" aria-hidden="true" key={`blank-${index}`} />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const date = `${monthKey}-${String(day).padStart(2, "0")}`;
          const daySessions = sessionsByDate.get(date) ?? [];
          const dateLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
          return <div className={`calendar-day ${date === today ? "today" : ""} ${daySessions.length ? "has-session" : ""}`} key={date} aria-label={`${dateLabel}${daySessions.length ? `, ${daySessions.length} session${daySessions.length === 1 ? "" : "s"}` : ""}`}>
            <time dateTime={date}>{day}</time>
            {daySessions.length > 0 && <span className="calendar-matches">{daySessions.map((session, sessionIndex) => <Link href={`/app/groups/${groupId}/sessions/${session.id}`} aria-label={`Open ${dateLabel} session ${sessionIndex + 1}`} title={`Open session ${sessionIndex + 1}`} key={session.id}>⚽</Link>)}</span>}
          </div>;
        })}
      </div>
      <p className="calendar-note">Tap a football to open that session.</p>
    </section>
  );
}

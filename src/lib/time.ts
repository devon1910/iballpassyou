import type { FootballSession, Schedule } from "@/types/domain";

export function isoWeekday(date: Date, timezone: string) {
  const short = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: timezone }).format(date);
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(short) + 1;
}

export function periodSessions(
  sessions: FootballSession[],
  period: "latest" | "month" | "year" | "all",
  timezone: string,
  now = new Date(),
) {
  const sorted = [...sessions].sort((a, b) => b.kickoffAt.localeCompare(a.kickoffAt));
  if (period === "latest") return sorted.slice(0, 1);
  if (period === "all") return sorted;
  const parts = (date: Date) => {
    const mapped = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: timezone })
      .formatToParts(date).reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {});
    return { year: mapped.year, month: mapped.month };
  };
  const current = parts(now);
  return sorted.filter((session) => {
    const value = parts(new Date(session.kickoffAt));
    return value.year === current.year && (period === "year" || value.month === current.month);
  });
}

export function preferredSchedule(schedules: Schedule[], now: Date, timezone: string) {
  const active = schedules.filter((schedule) => schedule.active);
  return active.find((schedule) => schedule.dayOfWeek === isoWeekday(now, timezone)) ?? active[0];
}

export function localDateInput(now: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: timezone }).format(now);
}

export function isFutureLocalDate(date: string, timezone: string, now = new Date()) {
  return date > localDateInput(now, timezone);
}

export function localDateTimeToIso(date: string, time: string, timezone: string) {
  const probe = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(probe).reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  const viewedAsUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  const offsetMs = viewedAsUtc - probe.getTime();
  return new Date(probe.getTime() - offsetMs).toISOString();
}

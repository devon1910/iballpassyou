import Link from "next/link";
import type { LeaderboardPeriod } from "@/types/domain";

const periods: [LeaderboardPeriod, string][] = [["latest", "Latest"], ["month", "Month"], ["year", "Year"], ["all", "All"]];
export function PeriodSwitcher({ active, base }: { active: LeaderboardPeriod; base: string }) {
  return <nav className="periods" aria-label="Leaderboard period">{periods.map(([value, label]) =>
    <Link key={value} className={active === value ? "active" : ""} href={`${base}?period=${value}`}>{label}</Link>)}</nav>;
}


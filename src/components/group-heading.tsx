import Link from "next/link";
import { LockKeyhole, Settings } from "lucide-react";
import type { Group } from "@/types/domain";
import { formatSchedule } from "@/lib/format";

export function GroupHeading({ group, privateLabel = true, settingsHref }: { group: Group; privateLabel?: boolean; settingsHref?: string }) {
  return <div className="page-head compact">
    {settingsHref ? <Link className="group-settings-link" href={settingsHref} aria-label={`Open ${group.name} settings`} title="Group settings"><Settings size={21} strokeWidth={1.8} aria-hidden /></Link> : null}
    {group.visibility === "private" && privateLabel ? <span className="privacy"><LockKeyhole size={13} aria-hidden /> Private group</span> : null}
    <h1>{group.name.toUpperCase()}</h1>
    <div className="schedule">{group.schedules.filter((s) => s.active).length ? group.schedules.filter((s) => s.active).map((s) => <div key={s.id}>{formatSchedule(s)}</div>) : <div>Schedule varies</div>}</div>
  </div>;
}

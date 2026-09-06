import { LockKeyhole } from "lucide-react";
import type { Group } from "@/types/domain";
import { formatSchedule } from "@/lib/format";

export function GroupHeading({ group, privateLabel = true }: { group: Group; privateLabel?: boolean }) {
  return <div className="page-head compact">
    {group.visibility === "private" && privateLabel ? <span className="privacy"><LockKeyhole size={13} aria-hidden /> Private group</span> : null}
    <h1>{group.name.toUpperCase()}</h1>
    <div className="schedule">{group.schedules.filter((s) => s.active).length ? group.schedules.filter((s) => s.active).map((s) => <div key={s.id}>{formatSchedule(s)}</div>) : <div>Schedule varies</div>}</div>
  </div>;
}

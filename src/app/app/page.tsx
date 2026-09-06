import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { formatSchedule } from "@/lib/format";
import { getMyGroups } from "@/lib/data";
export const metadata={title:"Your groups"};
export default async function GroupsPage(){const groups=await getMyGroups();return <main className="shell"><SiteNav/><div className="page-head"><p className="eyebrow">Admin</p><h1>YOUR GROUPS</h1><p className="lede">One account, every group you help run.</p></div><div className="list">{groups.map(group=><Link className="list-row" href={`/app/groups/${group.id}`} key={group.id}><div className="list-row-main"><strong>{group.visibility==="private"?<><LockKeyhole size={14} aria-hidden style={{display:"inline",marginRight:8}}/><span className="sr-only">Private: </span></>:null}{group.name}</strong><div className="schedule">{group.schedules.filter(s=>s.active).map(s=><div key={s.id}>{formatSchedule(s)}</div>)}</div></div><span className="arrow">→</span></Link>)}</div><div className="hero-action"><Link className="button primary" href="/app/groups/new">Create a group</Link></div></main>}

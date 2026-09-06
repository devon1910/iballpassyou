import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { formatSchedule } from "@/lib/format";
import { leaderboardFor } from "@/lib/view-data";
import { getPublicGroups } from "@/lib/data";

export const metadata = { title: "Explore" };
export default async function ExplorePage() {
  const groups = await getPublicGroups();
  return <div className="explore"><main className="shell wide"><SiteNav />
    <div className="explore-hero"><Image src="/brand/pitch-default.jpeg" alt="Football pitch" fill sizes="100vw" /><div className="photo-shade" /><h1>EXPLORE</h1></div>
    <p className="lede" style={{marginTop:24}}>Other football groups are keeping receipts too. See their tables.</p>
    <div className="cards">{groups.map((group) => { const leader = leaderboardFor(group,"month")[0]; return <article className="group-card" key={group.id}>
      <h2>{group.name}</h2><div className="schedule">{group.schedules.filter((s) => s.active).map((s) => <div key={s.id}>{formatSchedule(s)}</div>)}</div>
      <div className="card-leader"><p className="section-label">This month’s leader</p>{leader ? <div className="card-score"><div><strong>{leader.name}</strong><small>{leader.goals}G {leader.assists}A</small></div><b>{leader.rating}</b></div> : <p className="muted">No sessions yet</p>}</div>
      <Link className="button" href={`/groups/${group.publicSlug}`}>View group</Link>
    </article>; })}</div>
  </main></div>;
}

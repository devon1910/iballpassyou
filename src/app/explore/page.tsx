import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SiteNav } from "@/components/site-nav";
import { FeaturedGoals } from "@/components/featured-goals";
import { formatSchedule } from "@/lib/format";
import { leaderboardFor } from "@/lib/view-data";
import { getPublicGroups } from "@/lib/data";
import type { Group } from "@/types/domain";

export const metadata = { title: "Explore" };

function GroupsLoading() {
  return <div className="explore-groups-loading" role="status" aria-live="polite"><span className="receipt-loader-track" aria-hidden="true" /><span>LOADING GROUPS</span></div>;
}

function GroupCard({ group }: { group: Group }) {
  const leader = leaderboardFor(group, "month")[0];
  return <article className="group-card">
    <h2>{group.name}</h2>
    <div className="schedule">{group.schedules.filter((s) => s.active).map((s) => <div key={s.id}>{formatSchedule(s)}</div>)}</div>
    <div className="card-leader"><p className="section-label">This month&apos;s leader</p>{leader ? <div className="card-score"><div><strong>{leader.name}</strong><small>{leader.goals}G {leader.assists}A</small></div><b>{leader.rating}</b></div> : <p className="muted">No sessions yet</p>}</div>
    <Link className="button" href={`/groups/${group.publicSlug}`}>View group</Link>
  </article>;
}

async function PublicGroups() {
  const groups = await getPublicGroups();
  return <>
    <div className="section-row explore-groups-head"><p className="section-label">Public groups</p></div>
    {groups.length ? <div className="cards">{groups.map((group) => <GroupCard group={group} key={group.id} />)}</div> : <div className="explore-empty"><p>No public groups yet. Start a group to keep the receipts.</p><Link className="button primary" href="/auth/sign-in">Start your group</Link></div>}
  </>;
}

export default function ExplorePage() {
  return <div className="explore"><main className="shell wide"><SiteNav />
    <div className="explore-hero"><Image src="/brand/pitch-default.jpeg" alt="Football pitch" fill sizes="100vw" /><div className="photo-shade" /><h1>EXPLORE</h1></div>
    <p className="lede" style={{ marginTop: 24 }}>Watch the goals worth replaying, then explore the football groups keeping the receipts.</p>
    <Suspense fallback={<GroupsLoading />}><PublicGroups /></Suspense>
    <FeaturedGoals />
  </main></div>;
}

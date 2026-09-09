import { PlayerManager } from "@/components/player-manager";
import { SiteNav } from "@/components/site-nav";
import { getGroupOr404 } from "@/lib/data";

export default async function PlayersPage({ params }: PageProps<"/app/groups/[groupId]/players">) {
  const { groupId } = await params;
  const group = await getGroupOr404(groupId);
  return <main className="shell">
    <SiteNav backHref={`/app/groups/${groupId}`} />
    <div className="page-head">
      <p className="eyebrow">{group.name}</p>
      <h1>PLAYERS</h1>
      <p className="lede">Manage availability and the private player details used to suggest balanced teams.</p>
    </div>
    <PlayerManager initial={group.players} groupId={group.id} />
  </main>;
}

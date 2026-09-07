import { PhotoActionPage } from "@/components/photo-action-page";
import { SessionLogger } from "@/components/session-logger";
import { SiteNav } from "@/components/site-nav";
import { getGroupOr404 } from "@/lib/data";

export default async function LogSessionPage({ params }: PageProps<"/app/groups/[groupId]/log">) {
  const { groupId } = await params;
  const group = await getGroupOr404(groupId);

  return (
    <PhotoActionPage>
      <SiteNav backHref={`/app/groups/${groupId}`} />
      <SessionLogger group={group} />
    </PhotoActionPage>
  );
}

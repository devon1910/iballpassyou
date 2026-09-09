"use client";

import { ShareImagePreview } from "@/components/share-image-preview";
import { drawLeaderboardImage, leaderboardImagePages, type LeaderboardImageData } from "@/lib/leaderboard-image";

export function ShareLeaderboard({ data, path }: { data: LeaderboardImageData; path?: string }) {
  const pages = leaderboardImagePages(data.rows);
  return <ShareImagePreview
    buttonLabel="Share leaderboard" title="Share your leaderboard" filename={`${data.groupName}-${data.periodLabel}-leaderboard`}
    path={path} shareText={`${data.groupName} · ${data.periodLabel} leaderboard`} linkLabel="Copy leaderboard link" selectionLabel="Leaderboard card to share"
    variants={pages.map((rows, index) => ({
      label: `Players ${index * 10 + 1}–${index * 10 + rows.length} · Card ${index + 1} of ${pages.length}`,
      description: `${data.groupName}, ${data.periodLabel}. Card ${index + 1} of ${pages.length}. ${rows.map(row => `${row.rank}. ${row.name}: ${row.goals} goals, ${row.assists} assists, ${row.rating} rating`).join(". ")}`,
      draw: canvas => drawLeaderboardImage(canvas, data, rows, index, pages.length),
    }))}
  />;
}

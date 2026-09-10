"use client";

import { ShareImagePreview } from "@/components/share-image-preview";
import {
  drawLeaderboardImage,
  drawLeaderboardOgImage,
  drawLeaderboardStoryImage,
  type LeaderboardImageData,
} from "@/lib/leaderboard-image";

export function ShareLeaderboard({ data, path }: { data: LeaderboardImageData; path?: string }) {
  const visibleRows = data.rows.slice(0, 6);
  const overflow = Math.max(0, data.rows.length - visibleRows.length);
  const description = `${data.groupName}, ${data.periodLabel}. Top ${visibleRows.length} players${overflow ? `, plus ${overflow} more at the group link` : ""}.`;
  return <ShareImagePreview
    buttonLabel="Share leaderboard receipt"
    title="Share the table receipt"
    filename={`${data.groupName}-${data.periodLabel}-table`}
    path={path}
    shareText={`${data.groupName} · ${data.periodLabel} · KEEP THE RECEIPTS`}
    linkLabel="Copy leaderboard link"
    selectionLabel="Receipt export"
    variants={[
      {
        label: "Feed · 1080×1350",
        fileSuffix: "table",
        aspectRatio: 1080 / 1350,
        description,
        draw: canvas => drawLeaderboardImage(canvas, data),
      },
      {
        label: "Story · 1080×1920",
        fileSuffix: "story",
        aspectRatio: 1080 / 1920,
        description: `${description} Story receipt with platform dead zones.`,
        draw: canvas => drawLeaderboardStoryImage(canvas, data),
      },
      {
        label: "OG · 1200×630",
        fileSuffix: "og",
        aspectRatio: 1200 / 630,
        description: `${data.groupName}, ${data.periodLabel}. Open Graph table receipt.`,
        draw: canvas => drawLeaderboardOgImage(canvas, data),
      },
    ]}
  />;
}

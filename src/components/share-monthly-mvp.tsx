"use client";

import { ShareImagePreview } from "@/components/share-image-preview";
import { drawMonthlyMvpImage, drawMonthlyMvpOgImage, drawMonthlyMvpStoryImage, type MonthlyMvpImageData } from "@/lib/monthly-mvp-image";

export function ShareMonthlyMvp({ data, path }: { data: MonthlyMvpImageData; path?: string }) {
  const names = data.names.join(" / ");
  const description = `${names}, Player of the Month for ${data.month} in ${data.groupName}, with ${data.points} points.`;
  return <ShareImagePreview
    buttonLabel="Share Player of the Month"
    title="iballpassyou · Player of the Month"
    filename={`${data.groupName}-${data.month}-player-of-the-month`}
    path={path}
    shareText={`${names} · Player of the Month · ${data.month} · ${data.groupName}`}
    selectionLabel="Receipt format"
    linkLabel="Copy leaderboard link"
    variants={[
      { label: "Feed · 4:5", description, fileSuffix: "monthly-mvp", draw: canvas => drawMonthlyMvpImage(canvas, data) },
      { label: "Story · 9:16", description: `${description} Story receipt.`, aspectRatio: 1080 / 1920, fileSuffix: "story", draw: canvas => drawMonthlyMvpStoryImage(canvas, data) },
      { label: "Link preview · OG", description: `${description} Link preview.`, aspectRatio: 1200 / 630, fileSuffix: "og", draw: canvas => drawMonthlyMvpOgImage(canvas, data) },
    ]}
  />;
}

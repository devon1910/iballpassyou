"use client";

import { ShareImagePreview } from "@/components/share-image-preview";
import {
  drawMotmReceiptImage,
  drawMotmReceiptOgImage,
  drawMotmReceiptStoryImage,
  type AchievementImageData,
} from "@/lib/achievement-image";

export function ShareMotmAchievement({ data, path, filename }: { data: AchievementImageData; path: string; filename: string }) {
  const names = data.names?.join(" / ") || data.playerName;
  const description = `${names}, ${data.groupName}. Man of the Match with ${data.points} points${data.date ? ` on ${data.date}` : ""}.`;

  return <ShareImagePreview
    buttonLabel="Share Man of the Match"
    title="iballpassyou · Man of the Match"
    filename={filename}
    path={path}
    shareText={`${names} · Man of the Match · ${data.groupName}`}
    selectionLabel="Receipt format"
    linkLabel="Copy receipt link"
    variants={[
      { label: "Feed · 4:5", description, fileSuffix: "motm", draw: canvas => drawMotmReceiptImage(canvas, data) },
      { label: "Story · 9:16", description: `${description} Story receipt.`, aspectRatio: 1080 / 1920, fileSuffix: "story", draw: canvas => drawMotmReceiptStoryImage(canvas, data) },
      { label: "Link preview · OG", description: `${description} Link preview.`, aspectRatio: 1200 / 630, fileSuffix: "og", draw: canvas => drawMotmReceiptOgImage(canvas, data) },
    ]}
  />;
}

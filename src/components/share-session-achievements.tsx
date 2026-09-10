"use client";

import { ShareImagePreview } from "@/components/share-image-preview";
import {
  drawSessionAchievementImage,
  drawSessionAchievementOgImage,
  drawSessionAchievementStoryImage,
  type SessionAchievementImageData,
} from "@/lib/session-achievement-image";

export function ShareSessionAchievements({ data, path }: { data: SessionAchievementImageData; path?: string }) {
  const names = Array.isArray(data.motm.names) ? data.motm.names.join(" / ") : data.motm.names;
  return <ShareImagePreview
    buttonLabel="Share session receipt"
    title="Share this receipt"
    filename={`${data.groupName}-session`}
    path={path}
    shareText={`${data.groupName} · ${data.date} · KEEP THE RECEIPTS`}
    selectionLabel="Receipt export"
    linkLabel="Copy session link"
    variants={[
      {
        label: "Feed · 1080×1350",
        fileSuffix: "session",
        aspectRatio: 1080 / 1350,
        description: `${data.groupName}, ${data.date}. Man of the Match: ${names}. ${data.records.length} receipt milestones.`,
        draw: canvas => drawSessionAchievementImage(canvas, data),
      },
      {
        label: "Story · 1080×1920",
        fileSuffix: "story",
        aspectRatio: 1080 / 1920,
        description: `${data.groupName}, ${data.date}. Story receipt with platform dead zones. Man of the Match: ${names}.`,
        draw: canvas => drawSessionAchievementStoryImage(canvas, data),
      },
      {
        label: "OG · 1200×630",
        fileSuffix: "og",
        aspectRatio: 1200 / 630,
        description: `${data.groupName}, ${data.date}. Open Graph receipt. Man of the Match: ${names}.`,
        draw: canvas => drawSessionAchievementOgImage(canvas, data),
      },
    ]}
  />;
}

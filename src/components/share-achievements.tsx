"use client";

import { ShareImagePreview } from "@/components/share-image-preview";
import { drawAchievementImage, type AchievementImageData } from "@/lib/achievement-image";

export function ShareAchievements({ data, path }: { data: AchievementImageData; path: string }) {
  const records = data.records.length ? data.records : [undefined];
  return <ShareImagePreview
    buttonLabel="Share player achievements" title="Share your achievements" filename={`${data.playerName}-achievements`}
    path={path} shareText={`${data.playerName} · ${data.groupName}\nView my player profile:`}
    selectionLabel="Personal best to feature" linkLabel="Copy profile link"
    variants={records.map(record => ({
      label: record ? `${record.format} · ${record.points} points` : "Career honours",
      description: `${data.playerName}, ${data.groupName}. ${data.motm} Man of the Match medals, ${data.mvp} monthly MVP trophies.${record ? ` Personal best: ${record.points} points, ${record.goals} goals, ${record.assists} assists. ${record.format}, ${record.date}.` : ""}`,
      draw: canvas => drawAchievementImage(canvas, data, record),
    }))}
  />;
}

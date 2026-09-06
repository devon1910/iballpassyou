import Image from "next/image";

export function ActionOverlay({ active = true, label = "Working" }: { active?: boolean; label?: string }) {
  if (!active) return null;
  return <div className="action-overlay" role="status" aria-live="polite" aria-label={label}>
    <div className="action-loader">
      <Image src="/brand/icon-lime.svg" width={58} height={58} alt="" priority />
      <span>{label}</span>
    </div>
  </div>;
}

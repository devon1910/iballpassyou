export function ActionOverlay({ active = true, label = "Working" }: { active?: boolean; label?: string }) {
  if (!active) return null;
  return <div className="action-overlay" role="status" aria-live="polite" aria-label={label}>
    <div className="action-loader"><span className="receipt-loader-track" aria-hidden="true" /><span>{label}</span></div>
  </div>;
}

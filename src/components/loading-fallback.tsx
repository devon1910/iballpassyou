"use client";

import { useEffect, useState } from "react";
import { ActionOverlay } from "@/components/action-overlay";

export function LoadingFallback() {
  const [stalled, setStalled] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setStalled(true), 10000); return () => window.clearTimeout(timer); }, []);
  if (stalled) return <main className="shell"><div className="page-head"><p className="eyebrow">Taking a little longer</p><h1>STILL LOADING</h1><p className="lede">The page is taking longer than expected. Your data is safe.</p></div><button className="button primary" type="button" onClick={() => window.location.reload()}>Try again</button></main>;
  return <ActionOverlay label="Loading" />;
}

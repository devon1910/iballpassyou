"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ActionOverlay } from "@/components/action-overlay";

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams}`;
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const active = pendingFrom === routeKey;

  useEffect(() => {
    const begin = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setPendingFrom(routeKey);
      timeoutRef.current = window.setTimeout(() => setPendingFrom(null), 12000);
    };
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement) || (target.target && target.target !== "_self") || target.hasAttribute("download")) return;
      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      const current = new URL(window.location.href);
      if (destination.pathname === current.pathname && destination.search === current.search) return;
      begin();
    };
    const handlePopState = () => begin();
    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [routeKey]);

  return <ActionOverlay active={active} label="Loading page" />;
}

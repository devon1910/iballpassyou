"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";

export function SiteNav({ backHref }: { backHref?: string }) {
  const pathname = usePathname();
  const isActive = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);
  return <header className="site-nav">
    {backHref ? <Link className="back-link" href={backHref} aria-label="Go back">←</Link> : <Brand />}
    <nav aria-label="Main navigation"><Link className={isActive("/explore") ? "active" : undefined} aria-current={isActive("/explore") ? "page" : undefined} href="/explore">Explore</Link><Link className={isActive("/app") && !isActive("/app/account") ? "active" : undefined} aria-current={isActive("/app") && !isActive("/app/account") ? "page" : undefined} href="/app">Groups</Link><Link className={isActive("/app/account") ? "active" : undefined} aria-current={isActive("/app/account") ? "page" : undefined} href="/app/account">Account</Link></nav>
  </header>;
}

import Link from "next/link";
import { Brand } from "@/components/brand";

export function SiteNav({ backHref }: { backHref?: string }) {
  return <header className="site-nav">
    {backHref ? <Link className="back-link" href={backHref} aria-label="Go back">←</Link> : <Brand />}
    <nav aria-label="Main navigation"><Link href="/explore">Explore</Link><Link href="/app">Groups</Link><Link href="/app/account">Account</Link></nav>
  </header>;
}

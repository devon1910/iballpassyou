import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer">
    <span className="mono">Built for the group chat → pitch → group chat loop.</span>
    <Link href="/feedback">Feedback <span aria-hidden="true">✦</span></Link>
  </footer>;
}

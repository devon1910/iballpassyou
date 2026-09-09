import Link from "next/link";
import { Brand } from "@/components/brand";

export default function Home() {
  return <main className="landing">
    <video className="landing-video" autoPlay muted loop playsInline preload="metadata" poster="/brand/pitch-default.jpeg" aria-hidden="true"><source src="/brand/iballpassyou-introvideo.mp4" type="video/mp4" /></video>
    <div className="photo-shade" />
    <div className="landing-inner">
      <Brand hero />
      <div className="landing-copy">
        <p className="eyebrow">Casual football. Proper receipts.</p>
        <h1>Pick who showed up.<br />See who ball pass.</h1>
        <p>Goals, assists and one table your whole group understands. No player accounts. No league admin.</p>
        <div className="landing-actions"><Link className="button primary" href="/auth/sign-in">Start your group</Link><Link className="text-link" href="/explore">Explore public leaderboards</Link></div>
      </div>
    </div>
  </main>;
}

import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/brand";

export default function Home() {
  return <main className="landing">
    <Image className="landing-photo" src="/brand/pitch-default.jpeg" alt="Players on a football pitch under floodlights" fill priority sizes="100vw" />
    <div className="photo-shade" />
    <div className="landing-inner">
      <Brand hero />
      <div className="landing-copy">
        <p className="eyebrow">Casual football. Proper receipts.</p>
        <h1>Pick who showed up.<br />See who ball pass.</h1>
        <p>Goals, assists and one table your whole group understands. No player accounts. No league admin.</p>
        <div className="landing-actions"><Link className="button primary" href="/auth/sign-in">Start your group</Link><Link className="text-link" href="/explore">Explore public leaderboards</Link></div>
      </div>
      <p className="mono landing-foot">Built for the group chat → pitch → group chat loop.</p>
    </div>
  </main>;
}

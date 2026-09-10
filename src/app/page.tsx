import Link from "next/link";
import { Brand } from "@/components/brand";
import { code128BPattern } from "@/lib/barcode";

function ReceiptBarcode() {
  const pattern = code128BPattern("https://iballpassyou.com/groups/spartan");
  const widths = [...pattern].map(Number);
  const modules = widths.reduce((total, width) => total + width, 0);
  let cursor = 0;
  const bars = widths.flatMap((width, index) => {
    const x = cursor;
    cursor += width;
    return index % 2 === 0 ? [<rect key={index} x={x} y="0" width={width} height="92" />] : [];
  });
  return <svg className="receipt-barcode" viewBox={`0 0 ${modules} 92`} preserveAspectRatio="none" aria-hidden="true">{bars}</svg>;
}

export default function Home() {
  return <main className="landing">
    <video className="landing-video" autoPlay muted loop playsInline preload="metadata" poster="/brand/pitch-default.jpeg" aria-hidden="true"><source src="/brand/iballpassyou-introvideo.mp4" type="video/mp4" /></video>
    <div className="photo-shade" />
    <div className="landing-inner">
      <header className="landing-header">
        <Brand />
        <nav aria-label="Homepage navigation">
          <Link href="/explore">Explore</Link>
          <Link href="/feedback">Feedback</Link>
          <Link className="button primary" href="/auth/sign-in">Start your group</Link>
        </nav>
      </header>
      <div className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">CASUAL FOOTBALL · PROPER RECEIPTS</p>
          <h1>Pick who showed up.<br />See who ball pass.</h1>
          <p>Goals, assists and one table your whole group understands. No player accounts. No league admin. Every session ends with a receipt worth sending.</p>
          <div className="landing-actions"><Link className="button primary" href="/auth/sign-in">Start your group</Link><Link className="button" href="/explore">See a real group&apos;s receipts</Link></div>
          <p className="landing-loop mono">GROUP CHAT · PITCH · GROUP CHAT</p>
        </div>
        <aside className="landing-receipt" aria-label="Example session receipt">
          <div className="receipt-masthead"><strong>iballpassyou</strong><span>KEEP THE RECEIPTS</span></div>
          <div className="receipt-rule receipt-rule-hard" />
          <div className="receipt-docket"><strong>SPARTAN</strong><strong>SESSION 41</strong><span>GREENFIELD PITCH</span><span>TUE 08.09.26</span></div>
          <div className="receipt-rule receipt-rule-dashed" />
          <div className="receipt-stamp">MAN OF THE MATCH</div>
          <h2>UCHE</h2>
          <div className="receipt-lines">
            <div><strong>GOALS</strong><span>2 × 3</span><b>6 PTS</b></div>
            <div><strong>ASSISTS</strong><span>1 × 2</span><b>2 PTS</b></div>
            <div><strong>WIN</strong><span>1 × 3</span><b>3 PTS</b></div>
          </div>
          <div className="receipt-total"><span>TOTAL</span><strong>11</strong></div>
          <ReceiptBarcode />
          <div className="receipt-footer"><span>IBALLPASSYOU.COM/SPARTAN</span><span>NO. 0041</span></div>
        </aside>
      </div>
    </div>
  </main>;
}

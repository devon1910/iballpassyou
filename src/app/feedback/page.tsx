import { FeedbackForm } from "@/components/feedback-form";
import { SiteNav } from "@/components/site-nav";

export default function FeedbackPage() {
  return <main className="shell"><SiteNav backHref="/" /><div className="page-head"><p className="eyebrow">We’re listening</p><h1>FEEDBACK, PLEASE ✦</h1><p className="lede">Spotted a bug, have a bright idea, or just want to say hi? Send it our way.</p></div><FeedbackForm /></main>;
}

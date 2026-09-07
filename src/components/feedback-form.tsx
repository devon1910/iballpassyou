"use client";

import { FormEvent, useState } from "react";

const destination = "davidsonekpokpobe@gmail.com";

export function FeedbackForm() {
  const [sent, setSent] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type") || "Suggestion");
    const message = String(form.get("message") || "").trim();
    const from = String(form.get("email") || "").trim();
    const subject = `[iBallPassYou] ${type}`;
    const body = `${message}${from ? `\n\nReply to: ${from}` : ""}`;
    window.location.href = `mailto:${destination}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }
  return <>
    {sent && <p className="notice" role="status">Your email app should be open with the feedback ready to send. Thank you ✨</p>}
    <form className="form-stack feedback-form" onSubmit={submit}>
      <label className="field"><span className="field-label">What’s up?</span><select className="select" name="type" defaultValue="Suggestion"><option>Suggestion</option><option>Something went wrong</option><option>Question</option></select></label>
      <label className="field"><span className="field-label">Tell us everything</span><textarea className="textarea" name="message" required placeholder="A tiny idea, a confusing moment, or a full-on bug report…" /></label>
      <label className="field"><span className="field-label">Your email <span className="muted">(optional)</span></span><input className="input" name="email" type="email" placeholder="So we can reply" /></label>
      <button className="button primary" type="submit">Send feedback ✦</button>
    </form>
  </>;
}

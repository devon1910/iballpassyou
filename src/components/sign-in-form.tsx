"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { isAuthApiError } from "@supabase/supabase-js";
import { InlineSpinner } from "@/components/inline-spinner";
import { createClient } from "@/lib/supabase/client";

const RESEND_DELAY_SECONDS = 60;

export function SignInForm({ nextPath = "/app", initialMessage = "", initialError = false }: { nextPath?: string; initialMessage?: string; initialError?: boolean }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [isError, setIsError] = useState(initialError);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inFlight = useRef(false);
  const retryAfter = useRef(0);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown(Math.max(0, Math.ceil((retryAfter.current - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function startCooldown() {
    retryAfter.current = Date.now() + RESEND_DELAY_SECONDS * 1000;
    setCooldown(RESEND_DELAY_SECONDS);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || Date.now() < retryAfter.current) return;
    inFlight.current = true;
    setMessage(""); setIsError(false); setPending(true);
    try {
      const supabase = createClient();
      const callback = new URL("/auth/callback", location.origin);
      callback.searchParams.set("next", nextPath);
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callback.toString() } });
      if (error) throw error;
      startCooldown();
      setMessage("Check your inbox and spam folder for a secure sign-in link. Please allow a little time for it to arrive before requesting another.");
    } catch (error) {
      setIsError(true);
      if (isAuthApiError(error) && (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")) {
        startCooldown();
        setMessage(error.code === "over_email_send_rate_limit"
          ? "Sign-in emails are temporarily rate limited. Check your inbox for the latest sign-in link, or try again later. The email limit may take longer than a minute to reset."
          : "Too many sign-in requests. Please wait before trying again. The limit may take longer than a minute to reset.");
      } else {
        setMessage("Couldn’t send the sign-in link. Check the address and try again.");
      }
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return <form className="form-stack" onSubmit={submit} aria-busy={pending}>
    <label className="field"><span className="field-label">Email address</span><input className="input" required disabled={pending} type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
    {message && <p className={`notice ${isError ? "error" : ""}`} role={isError ? "alert" : "status"}>{message}</p>}
    <button className="button primary" disabled={pending || cooldown > 0}>{pending && <InlineSpinner />}{pending ? "Sending…" : cooldown > 0 ? `Request another link in ${cooldown}s` : "Email me a sign-in link"}</button>
  </form>;
}

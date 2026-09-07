"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionOverlay } from "@/components/action-overlay";
import { createClient } from "@/lib/supabase/client";

type SignOutScope = "local" | "others" | "global";

export function SessionControls() {
  const router = useRouter();
  const [pendingLabel, setPendingLabel] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [confirmGlobal, setConfirmGlobal] = useState(false);
  const pending = Boolean(pendingLabel);

  const signOut = async (scope: SignOutScope) => {
    setPendingLabel(scope === "others" ? "Signing out other devices" : scope === "global" ? "Signing out everywhere" : "Signing out");
    setMessage("");
    setIsError(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope });
      if (error) throw error;
      if (scope === "others") {
        setMessage("Other browser and device sessions have been signed out. This device remains signed in.");
        setConfirmGlobal(false);
        return;
      }
      router.replace("/auth/sign-in?signedOut=1");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed", error);
      setIsError(true);
      setMessage("Couldn’t update your login sessions. Please try again.");
    } finally {
      setPendingLabel("");
    }
  };

  return (
    <section className="session-controls" aria-busy={pending}>
      <ActionOverlay active={pending} label={pendingLabel} />
      {message && <p className={`notice ${isError ? "error" : ""}`} role={isError ? "alert" : "status"}>{message}</p>}
      <div className="session-action">
        <div><strong>Sign out this device</strong><p>End only the login session in this browser.</p></div>
        <button className="button small" type="button" disabled={pending} onClick={() => signOut("local")}>Sign out</button>
      </div>
      <div className="session-action">
        <div><strong>Sign out other devices</strong><p>Keep this browser signed in and revoke your other sessions.</p></div>
        <button className="button small" type="button" disabled={pending} onClick={() => signOut("others")}>Sign out others</button>
      </div>
      <div className="session-action danger-zone">
        <div><strong>Sign out everywhere</strong><p>End this session and every other active login.</p></div>
        {!confirmGlobal
          ? <button className="text-link" type="button" disabled={pending} onClick={() => setConfirmGlobal(true)}>Sign out everywhere</button>
          : <div className="confirm-actions"><button className="button small" type="button" disabled={pending} onClick={() => signOut("global")}>Confirm</button><button className="text-link" type="button" disabled={pending} onClick={() => setConfirmGlobal(false)}>Cancel</button></div>}
      </div>
    </section>
  );
}

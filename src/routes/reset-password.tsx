import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/loom/Shell";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — loom." },
      { name: "description", content: "Choose a new password for your Loom account." },
      { property: "og:title", content: "Reset password — loom." },
      { property: "og:description", content: "Choose a new password for your Loom account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

const inputCls =
  "w-full bg-transparent border-0 border-b border-white/30 text-base text-white placeholder:text-white/25 px-0 py-3 focus:outline-none focus:border-white";

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    let settled = false;
    const ok = () => { settled = true; setReady(true); };
    const fail = (msg: string) => { if (!settled) { settled = true; setLinkError(msg); } };
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) ok();
    });

    (async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const errDesc = url.searchParams.get("error_description") || hash.get("error_description");
      if (errDesc) return fail("This reset link is invalid or has expired.");

      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) return fail("This reset link is invalid or has expired.");
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
          if (error) return fail("This reset link is invalid or has expired.");
        }
        window.history.replaceState(null, "", "/reset-password");
        const { data: s } = await supabase.auth.getSession();
        if (s.session) ok();
      } catch {
        fail("This reset link is invalid or has expired.");
      }
    })();

    const t = setTimeout(() => fail("We couldn't verify this link. It may have expired or already been used."), 8000);
    return () => { clearTimeout(t); data.subscription.unsubscribe(); };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError("Couldn't update your password. Request a new reset link.");
    setDone(true);
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-8">
      <div className="flex-1" />
      <div className="w-full max-w-xs text-center">
        <div className="text-4xl font-bold mb-8"><Brand /></div>
        {done ? (
          <>
            <h1 className="text-2xl font-bold">Password updated</h1>
            <p className="mt-2 text-sm text-white/60">Sign in with your new password.</p>
            <button onClick={() => navigate({ to: "/" })} className="bg-primary text-primary-foreground mt-8 w-full py-3 rounded-full text-sm font-bold">Back to sign in</button>
          </>
        ) : !ready && linkError ? (
          <>
            <h1 className="text-2xl font-bold">Link not valid</h1>
            <p className="mt-2 text-sm text-white/60">{linkError} Request a new reset email from the sign-in screen.</p>
            <button onClick={() => navigate({ to: "/" })} className="bg-primary text-primary-foreground mt-8 w-full py-3 rounded-full text-sm font-bold">Back to sign in</button>
          </>
        ) : !ready ? (
          <>
            <h1 className="text-2xl font-bold">Checking your link…</h1>
            <p className="mt-2 text-sm text-white/60">This only takes a moment.</p>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-3 text-left">
            <h1 className="text-2xl font-bold text-center">Choose a new password</h1>
            <input type="password" className={inputCls} placeholder="New password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} />
            <input type="password" className={inputCls} placeholder="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} />
            {error && <p className="text-xs pt-1 text-red-400">{error}</p>}
            <button type="submit" disabled={busy || !password || !confirm} className="bg-primary text-primary-foreground !mt-8 w-full py-3 rounded-full text-sm font-bold disabled:opacity-40">
              {busy ? "Saving" : "Update password"}
            </button>
          </form>
        )}
      </div>
      <div className="flex-[1.5]" />
    </div>
  );
}

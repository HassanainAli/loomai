import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/loom/Shell";
import { PASSWORD_RULES, passwordProblems, updatePasswordError, RESEND_COOLDOWN_SECONDS } from "@/loom/passwordRules";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>): { email?: string } => ({
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reset password | loom." },
      { name: "description", content: "Enter your reset code and choose a new password for your Loom account." },
      { property: "og:title", content: "Reset password | loom." },
      { property: "og:description", content: "Enter your reset code and choose a new password for your Loom account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

const inputCls =
  "w-full bg-transparent border-0 border-b border-white/30 text-base text-white placeholder:text-white/25 px-0 py-3 focus:outline-none focus:border-white";
const cta = "bg-primary text-primary-foreground !mt-8 w-full py-3 rounded-full text-sm font-bold disabled:opacity-40";

type Step = "checking" | "code" | "password" | "done";

function ResetPassword() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [step, setStep] = useState<Step>("checking");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown survives reloads (stored per browser) so codes can't be spammed.
  // Email is handed over in session storage so it never shows in the address bar.
  useEffect(() => {
    const saved = search.email || sessionStorage.getItem("loom-reset-email");
    if (saved) setEmail(saved);
  }, []);
  useEffect(() => {
    const until = Number(localStorage.getItem("loom-reset-cooldown") || 0);
    const left = Math.ceil((until - Date.now()) / 1000);
    if (left > 0) setCooldown(left);
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Older emails used links; still honor them if one arrives. Otherwise show code entry.
  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const linkCode = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const hasHashToken = hash.get("type") === "recovery" && hash.get("access_token");
      try {
        if (linkCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(linkCode);
          if (!error) return setStep("password");
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
          if (!error) return setStep("password");
        } else if (hasHashToken) {
          await new Promise((r) => setTimeout(r, 300));
          const { data } = await supabase.auth.getSession();
          if (data.session) return setStep("password");
        }
      } catch {
        /* fall through to code entry */
      }
      if (linkCode || tokenHash || hasHashToken) setInfo("That link expired. Enter the code from your newest email instead.");
      if (url.search || url.hash) window.history.replaceState(null, "", "/reset-password");
      setStep("code");
    })();
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    const token = code.replace(/\D/g, "");
    if (!em.endsWith(".edu")) return setError("Enter the university .edu email you signed up with.");
    if (token.length < 8) return setError("Enter the full code from your email.");
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({ email: em, token, type: "recovery" });
    setBusy(false);
    if (err) return setError("That code is wrong or expired. Check your newest email or send a new code.");
    setError("");
    setStep("password");
  }

  async function resend() {
    if (cooldown > 0) return;
    const em = email.trim().toLowerCase();
    if (!em.endsWith(".edu")) return setError("Enter your university .edu email first.");
    setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(em, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    localStorage.setItem("loom-reset-cooldown", String(Date.now() + RESEND_COOLDOWN_SECONDS * 1000));
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (err && /rate|limit|seconds/i.test(err.message)) {
      setInfo("");
      return setError("Please wait a moment before requesting another code.");
    }
    if (err) { setInfo(""); return setError("Couldn't send a new code. Try again in a minute."); }
    setCode(""); setPassword(""); setConfirm("");
    setInfo(`If an account exists for ${em}, a new code is on its way. Use the most recent one.`);
    setStep("code");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const problems = passwordProblems(password);
    if (problems.length) return setError(`Password needs: ${problems.join(", ").toLowerCase()}.`);
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(updatePasswordError(err.message));
    await supabase.auth.signOut();
    setStep("done");
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-8">
      <div className="flex-1" />
      <div className="w-full max-w-xs text-center">
        <div className="text-4xl font-bold mb-8"><Brand /></div>
        {step === "checking" && <h1 className="text-2xl font-bold">One moment…</h1>}

        {step === "code" && (
          <form onSubmit={verify} className="space-y-3 text-left">
            <h1 className="text-2xl font-bold text-center">Enter your reset code</h1>
            {email ? (
              <p className="text-sm text-white/60 text-center">
                We emailed an 8-digit code to <span className="text-white font-semibold break-all">{email}</span>. It may take a minute to arrive.{" "}
                <button type="button" onClick={() => { sessionStorage.removeItem("loom-reset-email"); navigate({ to: "/" }); }} className="underline underline-offset-4 text-white/70">Wrong email?</button>
              </p>
            ) : (
              <>
                <p className="text-sm text-white/60 text-center">Enter your university email and the code we sent.</p>
                <input type="email" className={`${inputCls} text-center`} placeholder="name@university.edu" autoComplete="email" onBlur={(e) => { const v = e.target.value.trim(); if (v) { setEmail(v); sessionStorage.setItem("loom-reset-email", v); } }} />
              </>
            )}
            <input
              className={`${inputCls} font-mono tracking-[0.25em] pl-[0.25em] text-center text-xl`}
              placeholder="00000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
            />
            {info && <p className="text-xs pt-1 text-white/70">{info}</p>}
            {error && <p className="text-xs pt-1 text-red-400">{error}</p>}
            <button type="submit" disabled={busy || !email || code.length < 8} className={cta}>
              {busy ? "Checking" : "Continue"}
            </button>
            <p className="pt-4 text-center">
              <button type="button" onClick={resend} disabled={cooldown > 0} className="text-sm text-white/50 underline underline-offset-4 disabled:no-underline disabled:opacity-60">{cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}</button>
            </p>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={save} className="space-y-3 text-left">
            <h1 className="text-2xl font-bold text-center">Choose a new password</h1>
            <input type="password" className={inputCls} placeholder="New password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} />
            <input type="password" className={inputCls} placeholder="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} />
            <ul className="pt-1 space-y-1 text-xs">
              {PASSWORD_RULES.map((r) => (
                <li key={r.id} className={r.test(password) ? "text-white/80" : "text-white/40"}>{r.test(password) ? "✓" : "·"} {r.label}</li>
              ))}
              <li className="text-white/40">· Can't match your previous password</li>
            </ul>
            {confirm.length > 0 && confirm !== password && <p className="text-xs pt-1 text-red-400">Passwords don't match.</p>}
            {error && <p className="text-xs pt-1 text-red-400">{error}</p>}
            <button type="submit" disabled={busy || passwordProblems(password).length > 0 || password !== confirm} className={cta}>
              {busy ? "Saving" : "Update password"}
            </button>
            <p className="pt-4 text-center">
              <button type="button" onClick={resend} disabled={cooldown > 0} className="text-sm text-white/50 underline underline-offset-4 disabled:no-underline disabled:opacity-60">{cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}</button>
            </p>
          </form>
        )}

        {step === "done" && (
          <>
            <h1 className="text-2xl font-bold">Password updated</h1>
            <p className="mt-2 text-sm text-white/60">Sign in with your new password.</p>
            <button onClick={() => navigate({ to: "/" })} className={cta}>Back to sign in</button>
          </>
        )}
      </div>
      <div className="flex-[1.5]" />
    </div>
  );
}

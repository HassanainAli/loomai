import { useState } from "react";
import { Brand } from "../Shell";
import { supabase } from "@/integrations/supabase/client";

type Mode = "signin" | "signup";

const inputCls =
  "loom-input w-full bg-transparent border-0 border-b border-white/30 text-left text-base text-white placeholder:text-white/25 px-0 py-3 focus:outline-none transition-all";

function formatDob(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  let f = d.slice(0, 2);
  if (d.length > 2) f += " / " + d.slice(2, 4);
  if (d.length > 4) f += " / " + d.slice(4, 8);
  return f;
}

/** Parses "MM / DD / YYYY" and returns an ISO date, or null if invalid. */
export function parseDob(v: string): string | null {
  const m = v.replace(/\s/g, "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    date.getFullYear() !== Number(yyyy) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getDate() !== Number(dd)
  )
    return null;
  return `${yyyy}-${mm}-${dd}`;
}

export function ageFrom(iso: string, now = new Date()) {
  const [y, m, d] = iso.split("-").map(Number);
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age;
}

export function Auth({ onNext }: { onNext: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const mismatch = mode === "signup" && confirm.length > 0 && confirm !== password;

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
  }

  async function submit() {
    const e = email.trim().toLowerCase();
    if (mode === "signup") {
      const problems: string[] = [];
      if (!name.trim()) problems.push("Please enter your name.");
      const iso = parseDob(dob);
      if (!iso) problems.push("Please enter a valid date of birth (MM / DD / YYYY).");
      else if (ageFrom(iso) < 18) problems.push("You must be 18 or older to join Loom.");
      if (!e.endsWith(".edu")) problems.push("Please use your university .edu email, not a personal one.");
      if (password.length < 6) problems.push("Password must be at least 6 characters.");
      if (password !== confirm) problems.push("Passwords don't match.");
      if (problems.length) return setError(problems.join("\n"));
      setError("");
      setBusy(true);
      const { data, error: err } = await supabase.auth.signUp({
        email: e,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { display_name: name.trim(), date_of_birth: iso },
        },
      });
      setBusy(false);
      if (err) {
        console.error("[Auth] signup error:", err);
        const msg = err.message || "";
        if (/18 or older/i.test(msg)) return setError("You must be 18 or older to join Loom.");
        if (/date of birth/i.test(msg)) return setError("Please enter a valid date of birth (MM / DD / YYYY).");
        if (/\.edu/i.test(msg)) return setError("Please use your university .edu email, not a personal one.");
        if (/database error/i.test(msg))
          return setError("We couldn't create your account. Check that you're 18+ and using a .edu email.");
        return setError(msg || "Could not create your account.");
      }
      if (data.session) return onNext();
      setSentTo(e);
      return;
    }

    if (!e.endsWith(".edu")) return setError("Please use a valid .edu email address.");
    setError("");
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: e, password });
    setBusy(false);
    if (err) {
      console.error("[Auth] signin error:", err);
      return setError(
        /confirm/i.test(err.message)
          ? "Please confirm your email first — check your university inbox."
          : "Incorrect email or password.",
      );
    }
    onNext();
  }

  async function forgot() {
    const e = email.trim().toLowerCase();
    setResetSent(false);
    if (!e.endsWith(".edu")) return setError("Enter your university .edu email above, then tap Forgot password.");
    setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(e, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) return setError("Couldn't send the reset email. Try again in a minute.");
    setResetSent(true);
  }

  async function resend() {
    if (!sentTo) return;
    await supabase.auth.resend({
      type: "signup",
      email: sentTo,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setResent(true);
  }

  const canSubmit =
    mode === "signup"
      ? name && dob && email && password && confirm && !mismatch
      : email && password;

  return (
    <div className="relative flex flex-col h-full bg-black text-white overflow-y-auto">
      <style>{`
        @keyframes loom-shutter { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
        .loom-shutter { animation: loom-shutter 0.45s ease-out both; }
        .loom-input:focus { border-color: #ff2bd6; box-shadow: 0 1px 0 0 #ff2bd6; }
        .loom-cta {
          background: linear-gradient(135deg, #ff2bd6 0%, #b026d3 55%, #4a0d6b 100%);
          box-shadow: 0 0 0 1px rgba(255,43,214,0.4), 0 8px 30px -8px rgba(255,43,214,0.55);
          transition: filter 0.2s ease, transform 0.1s ease;
        }
        .loom-cta:hover:not(:disabled) { filter: brightness(1.15); }
      `}</style>

      {sentTo ? (
        <div key="verify" className="loom-shutter flex flex-col items-center justify-center flex-1 px-8 py-10 text-center">
          <Brand style={{ fontSize: "3.5rem", fontWeight: 900 }} className="mb-8 leading-none" />
          <h2 className="text-2xl font-black mb-3">Check your inbox</h2>
          <p className="text-sm text-white/60 max-w-xs mb-2">We sent a confirmation link to</p>
          <p className="text-sm font-bold text-[#ff2bd6] mb-6 break-all">{sentTo}</p>
          <p className="text-xs text-white/50 max-w-xs mb-8">
            Tap the link in that email to verify you're a student, then come back and sign in.
          </p>
          <button
            onClick={resend}
            disabled={resent}
            className="text-sm font-medium text-white/80 underline underline-offset-4 disabled:no-underline disabled:text-white/40"
          >
            {resent ? "Link resent" : "Resend link"}
          </button>
          <button
            onClick={() => {
              setSentTo(null);
              setResent(false);
              setPassword("");
              setConfirm("");
              switchMode("signin");
            }}
            className="loom-cta mt-8 w-full max-w-xs px-8 py-3 rounded-full text-sm font-bold text-white"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <div className="loom-shutter flex flex-col items-center flex-1 px-8 py-10">
          <div aria-hidden className="flex-1" />
          <Brand style={{ fontSize: "3.5rem", fontWeight: 900 }} className="mb-8 leading-none" />

          <div key={mode} className="loom-shutter w-full max-w-xs">
            <h2 className="text-2xl font-black mb-1 text-center">
              {mode === "signup" ? "Join your campus" : "Welcome back"}
            </h2>
            <p className="text-sm text-white/50 mb-6 text-center">
              {mode === "signup"
                ? "Verified students only. Takes a minute."
                : "Sign in with your university email."}
            </p>

            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                submit();
              }}
              className="space-y-2"
            >
              {mode === "signup" && (
                <>
                  <input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    placeholder="Full name"
                    autoComplete="name"
                    maxLength={100}
                    className={inputCls}
                  />
                  <input
                    value={dob}
                    onChange={(e) => { setDob(formatDob(e.target.value)); setError(""); }}
                    placeholder="Date of birth (MM / DD / YYYY)"
                    inputMode="numeric"
                    autoComplete="bday"
                    className={inputCls}
                  />
                </>
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="name@university.edu"
                autoComplete="email"
                className={inputCls}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className={inputCls}
              />
              {mode === "signup" && (
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className={inputCls}
                />
              )}
              {mismatch && <p className="text-xs pt-1 text-red-400">Passwords don't match.</p>}
              {resetSent && <p className="text-xs pt-1 text-white/70">If an account exists, a reset link is on its way to {email.trim().toLowerCase()}.</p>}
              {error && <p className="text-xs pt-1 text-red-400 font-medium whitespace-pre-line">{error}</p>}

              <button
                type="submit"
                disabled={!canSubmit || busy}
                className="loom-cta !mt-8 w-full px-8 py-3 rounded-full text-sm font-bold text-white tracking-wide active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {mode === "signup" ? "Creating account" : "Signing in"}
                  </span>
                ) : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>

            {mode === "signin" && (
              <p className="mt-6 text-center">
                <button type="button" onClick={forgot} className="text-sm text-white/50 underline underline-offset-4 hover:text-[#ff2bd6]">
                  Forgot password?
                </button>
              </p>
            )}

            <p className="mt-4 text-center text-sm text-white/50">
              {mode === "signin" ? "New to Loom? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                className="font-bold text-white underline underline-offset-4 hover:text-[#ff2bd6]"
              >
                {mode === "signin" ? "Create account" : "Sign in"}
              </button>
            </p>
          </div>
          <div aria-hidden className="flex-[1.5]" />
        </div>
      )}

      <p className="px-8 pb-6 text-center text-[10px] leading-relaxed text-white/35 max-w-sm mx-auto">
        Loom is a closed-loop network. A verified university email is required to join the pool.
      </p>
    </div>
  );
}

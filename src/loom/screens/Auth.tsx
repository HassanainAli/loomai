import { useState } from "react";
import { Brand } from "../Shell";

type Mode = "signin" | "signup";

export function Auth({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("signup");
  const [scanning, setScanning] = useState(false);

  function submit() {
    if (!email.toLowerCase().trim().endsWith(".edu")) {
      setError("Please use a valid .edu email address.");
      return;
    }
    setError("");
    setScanning(true);
    setTimeout(() => onNext(), 900);
  }

  return (
    <div className="relative flex flex-col h-full bg-black text-white overflow-hidden">
      {/* Magenta scan line on success */}
      {scanning && (
        <div
          className="pointer-events-none absolute left-0 right-0 h-[2px] z-30"
          style={{
            top: 0,
            background:
              "linear-gradient(90deg, transparent, #ff2bd6 20%, #ff70e6 50%, #ff2bd6 80%, transparent)",
            boxShadow: "0 0 24px 6px #ff2bd6, 0 0 60px 12px rgba(255,43,214,0.6)",
            animation: "loom-scan 0.9s ease-out forwards",
          }}
        />
      )}
      {scanning && (
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{ animation: "loom-pulse 0.9s ease-out forwards" }}
        />
      )}

      <style>{`
        @keyframes loom-scan {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(800px); opacity: 0.9; }
        }
        @keyframes loom-pulse {
          0%, 70% { background: transparent; }
          85% { background: rgba(255, 43, 214, 0.18); }
          100% { background: transparent; }
        }
        @keyframes loom-shutter {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .loom-shutter { animation: loom-shutter 0.45s ease-out both; }
        .loom-input:focus {
          border-color: #ff2bd6;
          box-shadow: 0 1px 0 0 #ff2bd6, 0 0 18px 0 rgba(255, 43, 214, 0.55), 0 0 40px 0 rgba(255, 43, 214, 0.25);
        }
        .loom-cta {
          background: linear-gradient(135deg, #ff2bd6 0%, #b026d3 55%, #4a0d6b 100%);
          box-shadow: 0 0 0 1px rgba(255,43,214,0.4), 0 8px 30px -8px rgba(255,43,214,0.55);
          transition: filter 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
        }
        .loom-cta:hover:not(:disabled) {
          filter: brightness(1.15) saturate(1.2);
          box-shadow: 0 0 0 1px #ff2bd6, 0 0 24px 4px rgba(255,43,214,0.7), 0 12px 40px -6px rgba(255,43,214,0.8);
        }
        .loom-oauth {
          border: 1px solid rgba(255, 43, 214, 0.45);
          transition: all 0.2s ease;
        }
        .loom-oauth:hover {
          border-color: #ff2bd6;
          box-shadow: 0 0 14px 0 rgba(255, 43, 214, 0.45);
          background: rgba(255, 43, 214, 0.06);
        }
      `}</style>

      <div className="loom-shutter flex flex-col items-center justify-center flex-1 px-8 py-10 text-center">
        <Brand
          style={{ fontSize: "4.5rem", fontWeight: 900 }}
          className="mb-4 leading-none"
        />
        <p className="text-sm text-white/60 mb-10 max-w-xs">
          Verify your university email to get started.
        </p>

        <div className="w-full max-w-xs">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="name@university.edu"
            className="loom-input w-full bg-transparent border-0 border-b border-white/30 text-center text-base text-white placeholder:text-white/25 px-0 py-3 focus:outline-none transition-all"
          />
          {error && (
            <p className="text-xs mt-3 text-red-400 font-medium">{error}</p>
          )}

          <p className="text-xs mt-5 text-white/50">
            {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-[#ff2bd6] hover:text-[#ff70e6] font-medium transition-colors"
            >
              {mode === "signup" ? "Sign in" : "Sign up"}
            </button>
          </p>

          <button
            onClick={submit}
            disabled={!email || scanning}
            className="loom-cta mt-8 w-full px-8 py-3 rounded-full text-sm font-bold text-white tracking-wide active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mode === "signup" ? "Next" : "Sign in"}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/15" />
            <span className="text-[10px] tracking-[0.3em] text-white/40">OR</span>
            <div className="flex-1 h-px bg-white/15" />
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={submit}
              className="loom-oauth w-full px-4 py-2.5 rounded-full text-xs font-medium text-white/90 bg-transparent"
            >
              Sign in with University Portal
            </button>
            <button
              type="button"
              onClick={submit}
              className="loom-oauth w-full px-4 py-2.5 rounded-full text-xs font-medium text-white/90 bg-transparent"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>

      <p className="px-8 pb-6 text-center text-[10px] leading-relaxed text-white/35 max-w-sm mx-auto">
        Loom is a closed-loop network. A verified university email is required to join the pool.
      </p>
    </div>
  );
}

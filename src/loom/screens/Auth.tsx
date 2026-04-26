import { useState } from "react";
import { Brand } from "../Shell";

export function Auth({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!email.toLowerCase().endsWith(".edu")) {
      setError("Only valid university emails accepted.");
      return;
    }
    setError("");
    onNext();
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <Brand
        style={{ fontSize: "5rem", fontWeight: 900 }}
        className="mb-16 leading-none"
      />

      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="you@university.edu"
        className="w-full max-w-xs bg-transparent border-0 border-b border-white/40 focus:border-white text-center text-base text-white placeholder:text-white/30 px-0 py-3 focus:outline-none transition-colors"
      />
      {error && (
        <p className="text-xs mt-3 text-white/70 font-medium">{error}</p>
      )}

      <button
        onClick={submit}
        disabled={!email}
        className="mt-10 px-8 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#FACC15", color: "#000" }}
      >
        Next
      </button>
    </div>
  );
}
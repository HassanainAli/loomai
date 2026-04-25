import { useState } from "react";
import { Brand, PrimaryButton } from "../Shell";

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
    <div className="flex flex-col h-full p-8 pt-20">
      <Brand className="text-5xl mb-3" />
      <p className="text-muted-foreground text-sm mb-16">
        Two matches. Once a day. No swiping.
      </p>

      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
        University email
      </label>
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
        placeholder="you@university.edu"
        className="w-full bg-secondary border border-border rounded-2xl px-5 py-4 text-base focus:outline-none focus:border-foreground transition-colors"
      />
      {error && (
        <p className="text-sm mt-3 text-foreground font-medium">{error}</p>
      )}

      <div className="flex-1" />
      <PrimaryButton onClick={submit} disabled={!email}>
        Next
      </PrimaryButton>
      <p className="text-xs text-muted-foreground text-center mt-4">
        We verify .edu addresses to keep Loom student-only.
      </p>
    </div>
  );
}
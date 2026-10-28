import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { seedTesters, wipeTesters } from "@/lib/admin-testers.functions";
import { validCampusMinimum } from "@/loom/dev/testers";
import { ADMIN_ACTIONS, type AdminActionKey } from "@/loom/dev/adminActions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Not found — loom." },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Page not found." },
      { property: "og:title", content: "loom." },
      { property: "og:description", content: "Page not found." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Stats = {
  engine_paused: boolean;
  min_campus_participants: number;
  drop_date: string;
  campuses: { campus: string; participants: number }[];
  answered_today: number;
  active_threads: number;
  test_accounts: number;
  last_run: { started_at: string; pairs_created: number | null; outcome: string; triggered_by: string } | null;
  loom_plus: string[];
};

function NotFound() {
  return (
    <div className="min-h-screen bg-black text-zinc-400 flex flex-col items-center justify-center gap-3 font-mono">
      <p className="text-lg">Page not found</p>
      <Link to="/" className="text-sm underline">Go home</Link>
    </div>
  );
}

function AdminPage() {
  const [state, setState] = useState<"loading" | "denied" | "ok">("loading");
  const [stats, setStats] = useState<Stats | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [minInput, setMinInput] = useState("");
  const [plusEmail, setPlusEmail] = useState("");
  const seed = useServerFn(seedTesters);
  const wipe = useServerFn(wipeTesters);

  const load = useCallback(async () => {
    const { data, error } = await (supabase as any).rpc("admin_get_stats");
    if (error) return setState("denied");
    setStats(data as Stats);
    setMinInput(String((data as Stats).min_campus_participants));
    setState("ok");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => (data.session ? load() : setState("denied")));
  }, [load]);

  const [pending, setPending] = useState<{ key: AdminActionKey; label: string; fn: () => Promise<string> } | null>(null);

  const run = async (label: string, fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ ok: true, text: await fn() });
      await load();
    } catch (e: any) {
      setMsg({ ok: false, text: `${label} failed: ${e?.message ?? "unknown error"}` });
    } finally {
      setBusy(false);
    }
  };
  const act = (label: string, fn: () => Promise<string>, key: AdminActionKey) => setPending({ key, label, fn });
  const rpc = async (name: string, args?: object) => {
    const { data, error } = await (supabase as any).rpc(name, args);
    if (error) throw new Error(error.message);
    return data;
  };

  if (state === "loading") return <div className="min-h-screen bg-black" />;
  if (state === "denied" || !stats) return <NotFound />;

  const card = "border border-fuchsia-500/40 rounded-xl p-5 bg-zinc-950 shadow-[0_0_24px_-12px_#FF2BD6]";
  const btn = "px-4 py-2 rounded-lg font-mono text-sm border transition disabled:opacity-40";

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-mono px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">loom<span className="text-[#FACC15]">.</span> <span className="text-[#FF2BD6]">god mode</span></h1>
          <Link to="/" className="text-xs text-cyan-300 underline">Back to app</Link>
        </header>
        {msg && (
          <p className={`text-sm p-3 rounded-lg border ${msg.ok ? "border-cyan-400/50 text-cyan-200" : "border-red-500/60 text-red-300"}`}>{msg.text}</p>
        )}

        <section className={card}>
          <h2 className="text-sm text-zinc-400 mb-2">Engine</h2>
          <div className="flex items-center justify-between gap-4">
            <p className="text-lg">{stats.engine_paused ? <span className="text-red-400">Paused</span> : <span className="text-cyan-300">Running</span>} · drop {stats.drop_date}</p>
            <button disabled={busy} className={`${btn} ${stats.engine_paused ? "border-cyan-400 text-cyan-300" : "border-red-500 text-red-300"}`}
              onClick={() => act("Engine switch", async () => { await rpc("admin_set_engine_paused", { p_paused: !stats.engine_paused }); return stats.engine_paused ? "Matching resumed." : "Matching paused."; },
                stats.engine_paused ? "resume" : "pause")}>
              {stats.engine_paused ? "Resume" : "Pause"}
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button disabled={busy} className={`${btn} border-[#FF2BD6] text-[#FF2BD6]`}
              onClick={() => act("Run drop", async () => `Drop ran: ${await rpc("admin_run_drop_now")} matches created.`, "drop")}>
              Run drop now
            </button>
            {stats.last_run && (
              <p className="text-xs text-zinc-400">Last run {new Date(stats.last_run.started_at).toLocaleString()} · {stats.last_run.outcome} · {stats.last_run.pairs_created ?? 0} matches · {stats.last_run.triggered_by}</p>
            )}
          </div>
        </section>

        <section className={card}>
          <h2 className="text-sm text-zinc-400 mb-2">Campus minimum</h2>
          <div className="flex gap-3">
            <input value={minInput} onChange={(e) => setMinInput(e.target.value)} inputMode="numeric"
              className="w-24 bg-black border border-zinc-700 rounded-lg px-3 py-2" aria-label="Campus minimum" />
            <button disabled={busy} className={`${btn} border-[#FACC15] text-[#FACC15]`}
              onClick={() => {
                const n = Number(minInput);
                if (!validCampusMinimum(n)) return setMsg({ ok: false, text: "Campus minimum must be a whole number from 1 to 500." });
                act("Campus minimum", async () => { await rpc("admin_set_campus_minimum", { p_min: n }); return `Campus minimum set to ${n}.`; }, "campusMin");
              }}>Save</button>
          </div>
          <ul className="mt-3 text-sm space-y-1">
            {stats.campuses.length === 0 && <li className="text-zinc-500">No onboarded students yet.</li>}
            {stats.campuses.map((c) => (
              <li key={c.campus}>{c.campus}: {c.participants}/{stats.min_campus_participants} {c.participants >= stats.min_campus_participants ? <span className="text-cyan-300">unlocked</span> : <span className="text-zinc-500">locked</span>}</li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="text-sm text-zinc-400 mb-2">Live stats</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-2xl text-[#FF2BD6]">{stats.answered_today}</p><p className="text-xs text-zinc-400">Answered today</p></div>
            <div><p className="text-2xl text-cyan-300">{stats.active_threads}</p><p className="text-xs text-zinc-400">Active chats</p></div>
            <div><p className="text-2xl text-[#FACC15]">{stats.test_accounts}</p><p className="text-xs text-zinc-400">Test accounts</p></div>
          </div>
        </section>

        <section className={card}>
          <h2 className="text-sm text-zinc-400 mb-2">Test students</h2>
          <div className="flex gap-3">
            <button disabled={busy} className={`${btn} border-cyan-400 text-cyan-300`}
              onClick={() => act("Seed", async () => { const r = await seed(); return `Ready: ${r.accounts.map((a) => a.email).join(", ")} · password ${r.password}`; }, "seed")}>
              Seed 2 testers
            </button>
            <button disabled={busy} className={`${btn} border-red-500 text-red-300`}
              onClick={() => act("Wipe", async () => `Removed ${(await wipe()).removed} test accounts.`, "wipe")}>
              Wipe test data
            </button>
          </div>
        </section>

        <section className={card}>
          <h2 className="text-sm text-zinc-400 mb-2">Loom+ testers</h2>
          <div className="flex gap-3 flex-wrap">
            <input value={plusEmail} onChange={(e) => setPlusEmail(e.target.value)} placeholder="Student email"
              className="flex-1 min-w-48 bg-black border border-zinc-700 rounded-lg px-3 py-2" aria-label="Loom+ email" />
            {([true, false] as const).map((on) => (
              <button key={String(on)} disabled={busy} className={`${btn} ${on ? "border-[#FF2BD6] text-[#FF2BD6]" : "border-zinc-600 text-zinc-300"}`}
                onClick={() => {
                  if (!/^[^\s@]+@[^\s@]+\.edu$/i.test(plusEmail.trim())) return setMsg({ ok: false, text: "Enter a valid .edu email." });
                  act("Loom+", async () => (await rpc("admin_set_loom_plus", { p_email: plusEmail.trim(), p_on: on })) === "ok" ? `Loom+ ${on ? "granted" : "removed"}.` : "No account with that email.", "loomPlus");
                }}>{on ? "Grant" : "Revoke"}</button>
            ))}
          </div>
          {stats.loom_plus.length > 0 && <p className="text-xs text-zinc-400 mt-2">Members: {stats.loom_plus.join(", ")}</p>}
        </section>
      </div>
      {pending && (() => {
        const info = ADMIN_ACTIONS[pending.key];
        return (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={info.title}>
            <div className={`${card} max-w-md w-full space-y-4`}>
              <h3 className="text-lg font-bold">{info.title}</h3>
              <div>
                <p className="text-xs text-zinc-400 mb-1">What happens</p>
                <p className="text-sm">{info.action}</p>
              </div>
              <div className={`rounded-lg border p-3 ${info.externalCalls > 0 ? "border-[#FACC15]/60" : "border-cyan-400/40"}`}>
                <p className="text-xs text-zinc-400 mb-1">Cost</p>
                <p className={`text-sm ${info.externalCalls > 0 ? "text-[#FACC15]" : "text-cyan-200"}`}>{info.cost}</p>
              </div>
              <div className="flex justify-end gap-3">
                <button className={`${btn} border-zinc-600 text-zinc-300`} onClick={() => setPending(null)}>Cancel</button>
                <button className={`${btn} ${info.destructive ? "border-red-500 text-red-300" : "border-[#FF2BD6] text-[#FF2BD6]"}`}
                  onClick={() => { const p = pending; setPending(null); run(p.label, p.fn); }}>{info.confirm}</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

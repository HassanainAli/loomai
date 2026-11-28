import { useEffect, useRef, useState } from "react";
import { Camera, Plus, X, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { compressProfilePhoto } from "@/lib/image-compress";
import { guestProfile } from "./guest/mockProfile";
import { canCompletePhotos, PHOTO_BUCKET, removePhoto, replacePhoto } from "./photoRules";
import { signProfilePhotos } from "./useProfilePhotos";

export function PhotoEditor({ userId, isGuest, onState }: {
  userId: string | null; isGuest: boolean;
  onState: (state: { valid: boolean; busy: boolean }) => void;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  const alive = useRef(true);
  const selected = useRef<{ index: number; file: File } | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const notify = useRef(onState);
  notify.current = onState;
  useEffect(() => {
    notify.current({ valid: canCompletePhotos(paths.length, busy, ready), busy });
  }, [paths.length, busy, ready]);
  useEffect(() => {
    alive.current = true;
    let off = false;
    setReady(false); setError(null);
    const load = async () => {
      try {
        if (isGuest) {
          if (!off) { setPaths([...guestProfile.photos]); setUrls([...guestProfile.photos]); setReady(true); }
          return;
        }
        if (!userId) throw new Error("Sign in again to add photos.");
        const { data, error: e } = await supabase.rpc("get_profile_photo_paths", { p_owner: userId });
        if (e) throw e;
        const saved = data ?? [];
        const signed = await signProfilePhotos(saved);
        // Retry stale orphan cleanup on reopen. The grace period avoids deleting
        // a new upload another tab is still committing; RLS protects saved files.
        for (let offset = 0; offset < 5000; offset += 100) {
          const { data: files, error: listError } = await supabase.storage.from(PHOTO_BUCKET).list(userId, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
          if (listError || !files) break;
          const stale = files.filter((f) => !saved.includes(`${userId}/${f.name}`) && f.created_at && Date.parse(f.created_at) < Date.now() - 3600000).map((f) => `${userId}/${f.name}`);
          if (stale.length) await supabase.storage.from(PHOTO_BUCKET).remove(stale);
          if (files.length < 100) break;
        }
        if (!off) { setPaths(saved); setUrls(signed); setReady(true); }
      } catch { if (!off) setError("Couldn't load photos. Try again."); }
    };
    void load();
    return () => { off = true; alive.current = false; };
  }, [userId, isGuest, revision]);

  async function commit(next: string[]) {
    if (isGuest) { guestProfile.photos = [...next]; return; }
    const { error: e } = await supabase.rpc("set_my_profile_photos", { p_paths: next, p_expected: paths });
    if (e) throw e;
  }

  async function change(index: number, file?: File) {
    if (lock.current || !ready) return;
    lock.current = true; setBusy(true); setError(null);
    let uploaded: string | undefined;
    try {
      let next: string[];
      let nextUrls = [...urls];
      if (file) {
        selected.current = { index, file };
        const compressed = await compressProfilePhoto(file);
        if (isGuest) {
          // Session-only data URL: never uploads the guest's selected file.
          const url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(compressed);
          });
          next = replacePhoto(paths, index, url); nextUrls = [...next];
        } else {
          const { data: session } = await supabase.auth.getUser();
          if (!userId || session.user?.id !== userId) throw new Error("Sign in again to add photos.");
          uploaded = `${userId}/${crypto.randomUUID()}.webp`;
          const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(uploaded, compressed, { contentType: "image/webp", cacheControl: "60", upsert: false });
          if (uploadError) throw uploadError;
          next = replacePhoto(paths, index, uploaded);
          nextUrls = await signProfilePhotos(next);
        }
      } else {
        next = removePhoto(paths, index); nextUrls = removePhoto(urls, index);
      }
      await commit(next);
      selected.current = null;
      if (alive.current) { setPaths(next); setUrls(nextUrls); }
      if (!isGuest) {
        const obsolete = paths.filter((p) => !next.includes(p));
        if (obsolete.length) {
          const { error: cleanup } = await supabase.storage.from(PHOTO_BUCKET).remove(obsolete);
          if (cleanup && alive.current) setError("Photo saved. Old-file cleanup will retry when you reopen photos later.");
        }
      }
    } catch (e) {
      // A lost response may still have committed. Never delete a referenced photo.
      if (!isGuest && userId) {
        const { data: saved, error: readError } = await supabase.rpc("get_profile_photo_paths", { p_owner: userId });
        if (!readError && saved) {
          if (uploaded && !saved.includes(uploaded)) await supabase.storage.from(PHOTO_BUCKET).remove([uploaded]);
          if (alive.current) { setPaths(saved); setUrls(await signProfilePhotos(saved).catch(() => [])); }
        }
      }
      if (alive.current) setError(e instanceof Error ? e.message : "Couldn't save that photo. Try again.");
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }

  return <div>
    <p className="text-[10px] uppercase text-muted-foreground mb-2">Photos</p>
    <div className="grid grid-cols-3 gap-2" aria-busy={busy}>
      {[0, 1, 2].map((i) => <div key={i} className="relative aspect-square">
        <input ref={(el) => { inputs.current[i] = el; }} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" className="hidden" aria-label={`Choose photo ${i + 1}`} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void change(i, f); }} />
        <Button variant="outline" disabled={busy || !ready || i > paths.length} onClick={() => inputs.current[i]?.click()} aria-label={urls[i] ? `Replace photo ${i + 1}` : `Upload photo ${i + 1}`} className={`w-full h-full p-0 rounded-lg overflow-hidden ${i === 0 ? "border-accent/40 bg-accent/5 text-accent" : "border-dashed bg-secondary text-muted-foreground"}`}>
        {urls[i] ? <img src={urls[i]} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" onError={() => setError("Couldn't load the photo. Tap retry to refresh it.")} /> : i === 0 ? <span className="flex flex-col items-center gap-1"><Camera className="w-5 h-5" /><span className="text-[9px] font-bold">Main photo</span></span> : <Plus className="w-5 h-5" />}
        </Button>
        {urls[i] && <Button variant="secondary" size="icon" disabled={busy || paths.length === 1} onClick={() => void change(i)} aria-label={`Remove photo ${i + 1}`} title={paths.length === 1 ? "Replace your main photo" : "Remove photo"} className="absolute top-1 right-1 w-6 h-6 rounded-full"><X className="w-3 h-3" /></Button>}
      </div>)}
    </div>
    {busy && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground mt-2"><Loader2 className="w-3 h-3 animate-spin" />Saving photo…</p>}
    {error && <div role="alert" className="mt-2 text-xs text-destructive flex items-center gap-2"><span>{error}</span><Button variant="ghost" size="icon" aria-label="Retry photos" onClick={() => { const pending = selected.current; if (pending && ready) void change(pending.index, pending.file); else setRevision((r) => r + 1); }}><RotateCcw className="w-4 h-4" /></Button></div>}
  </div>;
}
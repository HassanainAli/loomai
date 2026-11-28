import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PHOTO_BUCKET } from "./photoRules";

export async function signProfilePhotos(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 300);
  if (error || !data || data.some((photo) => !photo.signedUrl || photo.error)) throw new Error("Couldn't load photos. Try again.");
  return data.map((photo) => photo.signedUrl);
}

/** Storage policies independently enforce membership for every signed URL. */
export function useProfilePhotos(ownerId: string | undefined, guestUrls: string[] | undefined) {
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    let off = false;
    setUrls([]); setError(null);
    if (guestUrls) { setUrls(guestUrls); return; }
    if (!ownerId) return;
    const load = async () => {
      try {
        const { data, error: readError } = await supabase.rpc("get_profile_photo_paths", { p_owner: ownerId });
        if (readError) throw readError;
        const signed = await signProfilePhotos(data ?? []);
        if (!off) { setUrls(signed); setError(null); }
      } catch { if (!off) { setUrls([]); setError("Couldn't load photos."); } }
    };
    void load();
    const interval = window.setInterval(() => void load(), 240000);
    const onVisible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { off = true; window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [ownerId, guestUrls, version]);
  return { urls, error, retry };
}
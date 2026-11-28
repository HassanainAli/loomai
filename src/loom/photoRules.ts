export const MAX_PHOTOS = 3;
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const PHOTO_BUCKET = "profile-photos";

export function canCompletePhotos(count: number, busy: boolean, ready: boolean): boolean {
  return ready && !busy && count >= 1 && count <= MAX_PHOTOS;
}

export function replacePhoto(paths: string[], index: number, path: string): string[] {
  if (index < 0 || index > paths.length || index >= MAX_PHOTOS) throw new Error("Choose the next photo slot.");
  const next = [...paths];
  next[index] = path;
  return next;
}

export function removePhoto(paths: string[], index: number): string[] {
  return paths.filter((_, i) => i !== index);
}

export function validatePhotoFile(file: Pick<File, "size" | "type" | "name">): void {
  if (file.size === 0 || file.size > MAX_SOURCE_BYTES) throw new Error("Choose a photo under 15 MB.");
  if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type) && !(/\.(heic|heif)$/i.test(file.name) && !file.type)) {
    throw new Error("Choose a JPEG, PNG, WebP or HEIC photo.");
  }
}
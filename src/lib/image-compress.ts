import { MAX_UPLOAD_BYTES, validatePhotoFile } from "@/loom/photoRules";

/** Called only from the file-picker event, never during SSR. */
export async function compressProfilePhoto(source: File): Promise<File> {
  validatePhotoFile(source);
  let input = source;
  if (/image\/hei[cf]/.test(source.type) || /\.(heic|heif)$/i.test(source.name)) {
    const { default: convert } = await import("heic2any");
    const converted = await convert({ blob: source, toType: "image/jpeg", quality: 0.9 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    if (!blob) throw new Error("Couldn't read that photo. Try a JPEG instead.");
    input = new File([blob], "converted.jpg", { type: "image/jpeg" });
  }
  const { default: compress } = await import("browser-image-compression");
  try {
    const result = await compress(input, {
      maxSizeMB: 1.5, maxWidthOrHeight: 1200, initialQuality: 0.82,
      fileType: "image/webp", preserveExif: false, useWebWorker: false,
    });
    if (result.type !== "image/webp" || result.size > MAX_UPLOAD_BYTES) throw new Error("Photo is too large after processing.");
    return new File([result], "photo.webp", { type: "image/webp" });
  } catch {
    throw new Error("Couldn't process that photo. Try another photo or a JPEG export.");
  }
}
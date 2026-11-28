import { describe, it, expect } from "vitest";
import { canCompletePhotos, replacePhoto, removePhoto, validatePhotoFile } from "./photoRules";

describe("profile photo rules", () => {
  it("requires at least one successfully saved photo", () => {
    expect(canCompletePhotos(0, false, true)).toBe(false);
    expect(canCompletePhotos(1, false, true)).toBe(true);
  });
  it("prevents advancing during upload or before loading saved photos", () => {
    expect(canCompletePhotos(1, true, true)).toBe(false);
    expect(canCompletePhotos(1, false, false)).toBe(false);
  });
  it("permits up to three photos and rejects a fourth", () => {
    expect(canCompletePhotos(3, false, true)).toBe(true);
    expect(() => replacePhoto(["a", "b", "c"], 3, "d")).toThrow();
  });
  it("replaces without losing secondary photos", () => {
    expect(replacePhoto(["a", "b", "c"], 0, "new")).toEqual(["new", "b", "c"]);
  });
  it("promotes the next photo when the main photo is removed", () => {
    expect(removePhoto(["a", "b", "c"], 0)).toEqual(["b", "c"]);
  });
  it("rejects files above 15 MB", () => {
    expect(() => validatePhotoFile({ name: "photo.jpg", type: "image/jpeg", size: 15 * 1024 * 1024 + 1 })).toThrow();
  });
  it("rejects nonphotos even with an image extension", () => {
    expect(() => validatePhotoFile({ name: "photo.jpg", type: "image/svg+xml", size: 100 })).toThrow();
    expect(() => validatePhotoFile({ name: "photo.heic", type: "", size: 100 })).not.toThrow();
  });
});
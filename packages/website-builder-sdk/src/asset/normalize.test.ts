import { describe, it, expect } from "vitest";
import { assetImageFromLegacyEdit, getAssetCategory, normalizeToAsset } from "./normalize.js";
import { resolveAssetImage } from "../image/geometry.js";

describe("getAssetCategory", () => {
    it("buckets by MIME prefix", () => {
        expect(getAssetCategory("image/jpeg")).toBe("image");
        expect(getAssetCategory("image/svg+xml")).toBe("image");
        expect(getAssetCategory("video/mp4")).toBe("video");
    });

    it("treats everything else as a document", () => {
        expect(getAssetCategory("application/pdf")).toBe("document");
        expect(getAssetCategory("application/zip")).toBe("document");
        expect(getAssetCategory("")).toBe("document");
        expect(getAssetCategory(undefined)).toBe("document");
        expect(getAssetCategory(null)).toBe("document");
    });
});

describe("assetImageFromLegacyEdit", () => {
    it("maps hotspot -> focalPoint and keeps crop/alt/caption", () => {
        const image = assetImageFromLegacyEdit(
            {
                crop: { top: 0.1, left: 0, bottom: 0.1, right: 0 },
                hotspot: { x: 0.3, y: 0.7, width: 0.5, height: 0.5 },
                alt: "A cat",
                caption: "Meow"
            },
            { width: 800, height: 600 }
        );
        expect(image).toEqual({
            width: 800,
            height: 600,
            crop: { top: 0.1, left: 0, bottom: 0.1, right: 0 },
            focalPoint: { x: 0.3, y: 0.7 },
            alt: "A cat",
            caption: "Meow"
        });
    });

    it("returns undefined when there is nothing to store", () => {
        expect(assetImageFromLegacyEdit(undefined, {})).toBeUndefined();
        expect(assetImageFromLegacyEdit(null, { width: null, height: undefined })).toBeUndefined();
    });

    it("keeps dimensions even without an edit", () => {
        expect(assetImageFromLegacyEdit(undefined, { width: 100, height: 50 })).toEqual({
            width: 100,
            height: 50
        });
    });
});

describe("normalizeToAsset — legacy Website Builder image value", () => {
    const legacy = {
        id: "file-1",
        name: "cat.jpg",
        size: 1234,
        mimeType: "image/jpeg",
        src: "https://cdn/x/cat.jpg",
        width: 800,
        height: 600,
        edit: {
            crop: { top: 0.1, left: 0.1, bottom: 0.1, right: 0.1 },
            hotspot: { x: 0.25, y: 0.75, width: 1, height: 1 },
            alt: "A cat"
        }
    };

    it("keeps mimeType, maps edit -> image, and mirrors dimensions at the root", () => {
        const asset = normalizeToAsset(legacy);
        expect(asset).toEqual({
            id: "file-1",
            src: "https://cdn/x/cat.jpg",
            url: "https://cdn/x/cat.jpg",
            name: "cat.jpg",
            mimeType: "image/jpeg",
            size: 1234,
            width: 800,
            height: 600,
            image: {
                width: 800,
                height: 600,
                crop: { top: 0.1, left: 0.1, bottom: 0.1, right: 0.1 },
                focalPoint: { x: 0.25, y: 0.75 },
                alt: "A cat"
            }
        });
    });

    it("handles a legacy value with no edit (dimensions only)", () => {
        const asset = normalizeToAsset({ ...legacy, edit: undefined });
        expect(asset?.image).toEqual({ width: 800, height: 600 });
    });

    it("upgrades an original flat WB file value (type + top-level dims, no edit)", () => {
        // The shape existing released pages store: flat, uses `type`, no sub-object.
        const asset = normalizeToAsset({
            id: "f",
            src: "https://cdn/x.jpg",
            name: "x.jpg",
            type: "image/jpeg",
            size: 10,
            width: 800,
            height: 600
        });
        expect(asset).toEqual({
            id: "f",
            src: "https://cdn/x.jpg",
            url: "https://cdn/x.jpg",
            name: "x.jpg",
            mimeType: "image/jpeg",
            size: 10,
            width: 800,
            height: 600,
            image: { width: 800, height: 600 }
        });
    });

    it("does not attach image data for a non-image legacy value", () => {
        const asset = normalizeToAsset({
            ...legacy,
            mimeType: "application/pdf",
            edit: undefined,
            width: undefined,
            height: undefined
        });
        expect(asset?.mimeType).toBe("application/pdf");
        expect(asset?.width).toBeUndefined();
        expect(asset?.image).toBeUndefined();
    });
});

describe("normalizeToAsset — already-unified asset", () => {
    it("is idempotent for a well-formed image asset", () => {
        const asset = {
            id: "f2",
            src: "https://cdn/y/pic.png",
            url: "https://cdn/y/pic.png",
            name: "pic.png",
            mimeType: "image/png",
            size: 9,
            width: 400,
            height: 300,
            image: {
                width: 400,
                height: 300,
                crop: { top: 0, left: 0.2, bottom: 0, right: 0.2 },
                focalPoint: { x: 0.5, y: 0.5 },
                alt: "Pic"
            }
        };
        expect(normalizeToAsset(asset)).toEqual(asset);
    });

    it("preserves video data", () => {
        const asset = normalizeToAsset({
            id: "v1",
            src: "https://cdn/v/clip.mp4",
            name: "clip.mp4",
            mimeType: "video/mp4",
            size: 42,
            video: { autoplay: true, poster: "https://cdn/v/poster.jpg" }
        });
        expect(asset?.video).toEqual({ autoplay: true, poster: "https://cdn/v/poster.jpg" });
    });

    it("reads a 6.5 beta value that uses type and keeps dimensions only in image", () => {
        const asset = normalizeToAsset({
            id: "b1",
            src: "https://cdn/b/pic.jpg",
            url: "https://cdn/b/pic.jpg?crop=0.1,0,0.1,0",
            name: "pic.jpg",
            type: "image/jpeg",
            size: 5,
            image: { width: 1200, height: 900, crop: { top: 0.1, left: 0, bottom: 0.1, right: 0 } }
        });
        expect(asset).toEqual({
            id: "b1",
            src: "https://cdn/b/pic.jpg",
            url: "https://cdn/b/pic.jpg?crop=0.1,0,0.1,0",
            name: "pic.jpg",
            mimeType: "image/jpeg",
            size: 5,
            width: 1200,
            height: 900,
            image: { width: 1200, height: 900, crop: { top: 0.1, left: 0, bottom: 0.1, right: 0 } }
        });
    });

    it("fills image dimensions from the root when the image object lacks them", () => {
        const asset = normalizeToAsset({
            id: "r1",
            src: "https://cdn/r.jpg",
            name: "r.jpg",
            mimeType: "image/jpeg",
            size: 1,
            width: 640,
            height: 480,
            image: { alt: "Root dims" }
        });
        expect(asset?.image).toEqual({ width: 640, height: 480, alt: "Root dims" });
        expect(asset?.width).toBe(640);
        expect(asset?.height).toBe(480);
    });

    it("returns null for invalid input", () => {
        expect(normalizeToAsset(null)).toBeNull();
        expect(normalizeToAsset(undefined)).toBeNull();
        expect(normalizeToAsset("nope")).toBeNull();
        expect(normalizeToAsset(42)).toBeNull();
    });
});

describe("resolveAssetImage", () => {
    it("prefers override per property, falling back to base", () => {
        const merged = resolveAssetImage(
            { crop: { top: 0.1, left: 0, bottom: 0, right: 0 } },
            {
                crop: { top: 0.5, left: 0, bottom: 0, right: 0 },
                focalPoint: { x: 0.2, y: 0.2 },
                alt: "base"
            }
        );
        expect(merged.crop).toEqual({ top: 0.1, left: 0, bottom: 0, right: 0 });
        expect(merged.focalPoint).toEqual({ x: 0.2, y: 0.2 });
        expect(merged.alt).toBe("base");
    });
});

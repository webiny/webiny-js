import { describe, it, expect } from "vitest";
import { applyImageEditToAsset, fileItemToAsset, isImageAsset } from "./assetValue.js";

describe("assetValue", () => {
    it("fileItemToAsset writes mimeType and image dimensions at the root and in image", () => {
        const asset = fileItemToAsset({
            id: "file-1",
            src: "https://cdn.test/files/file-1/cat.jpg",
            name: "cat.jpg",
            type: "image/jpeg",
            size: 1234,
            width: 1200,
            height: 800
        });

        expect(asset.mimeType).toBe("image/jpeg");
        expect(asset.width).toBe(1200);
        expect(asset.height).toBe(800);
        expect(asset.image).toEqual({ width: 1200, height: 800 });
        expect(isImageAsset(asset)).toBe(true);
    });

    it("applyImageEditToAsset keeps the root dimensions in sync and sets the cropped url", () => {
        const asset = fileItemToAsset({
            id: "file-1",
            src: "https://cdn.test/files/file-1/cat.jpg",
            name: "cat.jpg",
            type: "image/jpeg",
            size: 1234,
            width: 1200,
            height: 800
        });

        const edited = applyImageEditToAsset(asset, {
            crop: { top: 0.1, left: 0, bottom: 0.1, right: 0 },
            alt: "A cat"
        });

        expect(edited.width).toBe(1200);
        expect(edited.height).toBe(800);
        expect(edited.image).toMatchObject({ width: 1200, height: 800, alt: "A cat" });
        expect(edited.url).toBe("https://cdn.test/files/file-1/cat.jpg?crop=0.1,0,0.1,0");
        expect(edited.src).toBe("https://cdn.test/files/file-1/cat.jpg");
    });
});

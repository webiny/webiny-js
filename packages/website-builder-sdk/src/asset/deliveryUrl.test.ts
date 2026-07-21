import { describe, it, expect } from "vitest";
import { getAssetCropParam, getWebinyAssetUrl } from "./deliveryUrl.js";

const asset = (crop?: any) => ({
    id: "f",
    src: "https://cdn/x/pic.jpg",
    name: "pic.jpg",
    type: "image/jpeg",
    size: 1,
    image: { width: 800, height: 600, ...(crop ? { crop } : {}) }
});

describe("getAssetCropParam", () => {
    it("serializes a crop as top,left,bottom,right", () => {
        expect(getAssetCropParam(asset({ top: 0.1, left: 0.2, bottom: 0.1, right: 0.05 }))).toBe(
            "0.1,0.2,0.1,0.05"
        );
    });

    it("is undefined for no crop or a full crop", () => {
        expect(getAssetCropParam(asset())).toBeUndefined();
        expect(getAssetCropParam(asset({ top: 0, left: 0, bottom: 0, right: 0 }))).toBeUndefined();
        expect(getAssetCropParam(null)).toBeUndefined();
    });
});

describe("getWebinyAssetUrl", () => {
    it("bakes the crop + width + format into the URL", () => {
        const url = getWebinyAssetUrl(asset({ top: 0.1, left: 0.2, bottom: 0.1, right: 0.05 }), {
            width: 1200,
            format: "auto"
        });
        expect(url).toBe("https://cdn/x/pic.jpg?crop=0.1,0.2,0.1,0.05&width=1200&format=auto");
    });

    it("omits the crop when there is none", () => {
        expect(getWebinyAssetUrl(asset(), { width: 640 })).toBe("https://cdn/x/pic.jpg?width=640");
    });

    it("can opt out of the crop", () => {
        expect(
            getWebinyAssetUrl(asset({ top: 0.1, left: 0, bottom: 0, right: 0 }), { crop: false })
        ).toBe("https://cdn/x/pic.jpg");
    });

    it("returns the bare src when no options apply", () => {
        expect(getWebinyAssetUrl(asset())).toBe("https://cdn/x/pic.jpg");
    });

    it("uses & when the src already has a query string", () => {
        const url = getWebinyAssetUrl(
            { src: "https://cdn/x/pic.jpg?v=2", image: {} },
            {
                width: 640
            }
        );
        expect(url).toBe("https://cdn/x/pic.jpg?v=2&width=640");
    });

    it("returns empty string for a missing asset", () => {
        expect(getWebinyAssetUrl(null)).toBe("");
        expect(getWebinyAssetUrl(undefined)).toBe("");
    });

    it("emits aspectRatio + focal (from the asset) when framing to a ratio", () => {
        const a = {
            ...asset(),
            image: { width: 800, height: 600, focalPoint: { x: 0.7, y: 0.4 } }
        };
        expect(getWebinyAssetUrl(a, { aspectRatio: "16:9", width: 1200 })).toBe(
            "https://cdn/x/pic.jpg?aspectRatio=16:9&focal=0.7,0.4&width=1200"
        );
    });

    it("omits focal when it is centered or opted out", () => {
        const centered = { ...asset(), image: { focalPoint: { x: 0.5, y: 0.5 } } };
        expect(getWebinyAssetUrl(centered, { aspectRatio: 1 })).toBe(
            "https://cdn/x/pic.jpg?aspectRatio=1"
        );
        const offCenter = { ...asset(), image: { focalPoint: { x: 0.7, y: 0.4 } } };
        expect(getWebinyAssetUrl(offCenter, { aspectRatio: 1, focal: false })).toBe(
            "https://cdn/x/pic.jpg?aspectRatio=1"
        );
    });
});

import { describe, it, expect } from "vitest";
import { IMAGE_RESIZE_WIDTHS, getImageDimensions, getImageSrcSet } from "./imageSrcSet.js";

const asset = (image?: any) => ({
    id: "f",
    src: "https://cdn/x/pic.jpg",
    name: "pic.jpg",
    type: "image/jpeg",
    size: 1,
    image: { width: 800, height: 600, ...image }
});

describe("getImageDimensions", () => {
    it("returns intrinsic dimensions when there is no crop", () => {
        expect(getImageDimensions(asset())).toEqual({ width: 800, height: 600 });
    });

    it("shrinks by the crop insets", () => {
        expect(
            getImageDimensions(asset({ crop: { top: 0.1, left: 0.25, bottom: 0.1, right: 0.25 } }))
        ).toEqual({ width: 400, height: 480 });
    });

    it("derives height from a target aspect ratio", () => {
        // Cropped width 400 @ 16:9 -> height 225.
        expect(
            getImageDimensions(asset({ crop: { top: 0, left: 0.25, bottom: 0, right: 0.25 } }), {
                aspectRatio: "16:9"
            })
        ).toEqual({ width: 400, height: 225 });
    });

    it("returns 0/0 when the intrinsic size is unknown", () => {
        expect(getImageDimensions({ image: {} })).toEqual({ width: 0, height: 0 });
        expect(getImageDimensions(null)).toEqual({ width: 0, height: 0 });
    });
});

describe("getImageSrcSet", () => {
    it("emits the full ladder with crop + format baked into every width", () => {
        const { srcSet, width, height } = getImageSrcSet(
            asset({ crop: { top: 0.1, left: 0, bottom: 0, right: 0 } }),
            { format: "auto" }
        );
        const entries = srcSet.split(", ");
        expect(entries).toHaveLength(IMAGE_RESIZE_WIDTHS.length);
        expect(entries[0]).toBe("https://cdn/x/pic.jpg?crop=0.1,0,0,0&width=128&format=auto 128w");
        expect(width).toBe(800);
        expect(height).toBe(540);
    });

    it("trims the ladder to a fixed CSS width (incl. 2x DPR)", () => {
        const { srcSet, src } = getImageSrcSet(asset(), { cssWidth: "300px" });
        const widths = srcSet.split(", ").map(e => Number(e.match(/width=(\d+)/)![1]));
        // Smallest set covering 300px up to 2x (600) -> 128, 384, 640.
        expect(widths).toEqual([128, 384, 640]);
        // `src` fallback is the largest emitted width.
        expect(src).toBe("https://cdn/x/pic.jpg?width=640");
    });

    it("returns empty strings for a missing asset", () => {
        expect(getImageSrcSet(null)).toEqual({ src: "", srcSet: "", width: 0, height: 0 });
    });
});

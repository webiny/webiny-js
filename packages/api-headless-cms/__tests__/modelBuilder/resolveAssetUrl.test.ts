import { describe, it, expect } from "vitest";
import { resolveAssetUrl } from "~/features/modelBuilder/fields/resolveAssetUrl.js";

describe("resolveAssetUrl", () => {
    const src = "https://cdn/x/pic.jpg";

    it("bakes the per-usage crop into the URL", () => {
        expect(
            resolveAssetUrl({
                src,
                image: { crop: { top: 0.1, left: 0.2, bottom: 0.1, right: 0.05 } }
            })
        ).toBe("https://cdn/x/pic.jpg?crop=0.1,0.2,0.1,0.05");
    });

    it("returns src unchanged when there is no crop", () => {
        expect(resolveAssetUrl({ src })).toBe(src);
        expect(resolveAssetUrl({ src, image: {} })).toBe(src);
    });

    it("treats a full/zero crop as a no-op", () => {
        expect(
            resolveAssetUrl({ src, image: { crop: { top: 0, left: 0, bottom: 0, right: 0 } } })
        ).toBe(src);
    });

    it("uses & when the src already has a query string", () => {
        expect(
            resolveAssetUrl({
                src: "https://cdn/x/pic.jpg?v=2",
                image: { crop: { top: 0.1, left: 0, bottom: 0, right: 0 } }
            })
        ).toBe("https://cdn/x/pic.jpg?v=2&crop=0.1,0,0,0");
    });

    it("returns null when there is no source", () => {
        expect(resolveAssetUrl(null)).toBeNull();
        expect(resolveAssetUrl(undefined)).toBeNull();
        expect(resolveAssetUrl({})).toBeNull();
    });
});

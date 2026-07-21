import { describe, it, expect } from "vitest";
import { normalizeImageOptions } from "~/features/assetDelivery/normalizeImageOptions.js";
import type { AssetRequestOptions } from "~/delivery/AssetDelivery/AssetRequest.js";

const normalize = (query: Record<string, any>, accept?: string) => {
    const options: AssetRequestOptions = { ...query };
    normalizeImageOptions(options, query, accept);
    return options;
};

describe("normalizeImageOptions", () => {
    it("parses a valid width into a number", () => {
        expect(normalize({ width: "800" }).width).toBe(800);
    });

    it("drops invalid or non-positive widths", () => {
        expect(normalize({ width: "abc" }).width).toBeUndefined();
        expect(normalize({ width: "0" }).width).toBeUndefined();
        expect(normalize({ width: "-10" }).width).toBeUndefined();
    });

    it("parses and clamps quality", () => {
        expect(normalize({ quality: "75" }).quality).toBe(75);
        expect(normalize({ quality: "150" }).quality).toBe(100);
        expect(normalize({ quality: "0" }).quality).toBe(1);
        expect(normalize({}).quality).toBeUndefined();
    });

    it("keeps a supported explicit format and drops unsupported ones", () => {
        expect(normalize({ format: "webp" }).format).toBe("webp");
        expect(normalize({ format: "gif" }).format).toBeUndefined();
    });

    it("resolves format=auto from the Accept header", () => {
        expect(normalize({ format: "auto" }, "image/avif,image/webp,*/*").format).toBe("avif");
        expect(normalize({ format: "auto" }, "image/webp,*/*").format).toBe("webp");
        expect(normalize({ format: "auto" }, "image/jpeg,*/*").format).toBeUndefined();
        expect(normalize({ format: "auto" }, undefined).format).toBeUndefined();
    });

    it("does not leave stray string values on the options", () => {
        const options = normalize({ width: "abc", quality: "nope", format: "bogus" });
        expect(options.width).toBeUndefined();
        expect(options.quality).toBeUndefined();
        expect(options.format).toBeUndefined();
    });

    it("parses a valid crop into normalized edge insets", () => {
        expect(normalize({ crop: "0.1,0.2,0.1,0.05" }).crop).toEqual({
            top: 0.1,
            left: 0.2,
            bottom: 0.1,
            right: 0.05
        });
    });

    it("clamps out-of-range crop values to 0..1", () => {
        // Negatives clamp to 0; the result must still be a valid (non-collapsing) crop.
        expect(normalize({ crop: "-0.5,-0.2,0.1,0.05" }).crop).toEqual({
            top: 0,
            left: 0,
            bottom: 0.1,
            right: 0.05
        });
    });

    it("drops a full, malformed, or collapsing crop (and the stray string)", () => {
        expect(normalize({ crop: "0,0,0,0" }).crop).toBeUndefined();
        expect(normalize({ crop: "0.1,0.2" }).crop).toBeUndefined();
        expect(normalize({ crop: "a,b,c,d" }).crop).toBeUndefined();
        expect(normalize({ crop: "0.6,0,0.6,0" }).crop).toBeUndefined();
        expect(normalize({}).crop).toBeUndefined();
    });
});

import { describe, it, expect } from "vitest";
import { normalizeImageOptions } from "~/features/assetDelivery/assetTypes/image/normalizeImageOptions.js";

const normalize = (query: Record<string, any>, accept?: string) => {
    return normalizeImageOptions(query, accept);
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
        expect(normalize({ crop: "-0.5,-0.2,0.1,0.05" }).crop).toEqual({
            top: 0,
            left: 0,
            bottom: 0.1,
            right: 0.05
        });
    });

    it("drops a full, malformed, or collapsing crop", () => {
        expect(normalize({ crop: "0,0,0,0" }).crop).toBeUndefined();
        expect(normalize({ crop: "0.1,0.2" }).crop).toBeUndefined();
        expect(normalize({ crop: "a,b,c,d" }).crop).toBeUndefined();
        expect(normalize({ crop: "0.6,0,0.6,0" }).crop).toBeUndefined();
        expect(normalize({}).crop).toBeUndefined();
    });

    it("parses aspectRatio from colon notation", () => {
        expect(normalize({ aspectRatio: "16:9" }).aspectRatio).toBeCloseTo(16 / 9);
    });

    it("parses aspectRatio from decimal", () => {
        expect(normalize({ aspectRatio: "1.5" }).aspectRatio).toBe(1.5);
    });

    it("drops invalid aspectRatio", () => {
        expect(normalize({ aspectRatio: "abc" }).aspectRatio).toBeUndefined();
        expect(normalize({ aspectRatio: "0" }).aspectRatio).toBeUndefined();
        expect(normalize({}).aspectRatio).toBeUndefined();
    });

    it("parses focal point", () => {
        expect(normalize({ focal: "0.3,0.7" }).focal).toEqual({ x: 0.3, y: 0.7 });
    });

    it("clamps focal point to 0..1", () => {
        expect(normalize({ focal: "-0.5,1.5" }).focal).toEqual({ x: 0, y: 1 });
    });

    it("drops malformed focal point", () => {
        expect(normalize({ focal: "0.3" }).focal).toBeUndefined();
        expect(normalize({ focal: "a,b" }).focal).toBeUndefined();
        expect(normalize({}).focal).toBeUndefined();
    });

    it("does not mutate the input query", () => {
        const query = { width: "800", quality: "75", format: "webp" };
        const original = { ...query };
        normalizeImageOptions(query, undefined);
        expect(query).toEqual(original);
    });
});

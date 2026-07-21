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

    it("does not mutate the input query", () => {
        const query = { width: "800", quality: "75", format: "webp" };
        const original = { ...query };
        normalizeImageOptions(query, undefined);
        expect(query).toEqual(original);
    });
});

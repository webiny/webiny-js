import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
    clampQuality,
    contentTypeForFormat,
    formatFromContentType,
    resolveRequestedFormat
} from "~/features/assetDelivery/transformation/index.js";
import { transformImageBuffer } from "~/features/assetDelivery/assetTypes/image/transformImage.js";

describe("resolveRequestedFormat", () => {
    it("returns undefined when nothing is requested", () => {
        expect(resolveRequestedFormat(undefined, "image/avif")).toBeUndefined();
    });

    it("returns the explicit format when supported", () => {
        expect(resolveRequestedFormat("webp", undefined)).toBe("webp");
        expect(resolveRequestedFormat("avif", undefined)).toBe("avif");
    });

    it("ignores unsupported explicit formats", () => {
        expect(resolveRequestedFormat("gif", undefined)).toBeUndefined();
        expect(resolveRequestedFormat("tiff", undefined)).toBeUndefined();
    });

    it("negotiates auto -> avif when Accept allows it", () => {
        expect(resolveRequestedFormat("auto", "image/avif,image/webp,*/*")).toBe("avif");
    });

    it("negotiates auto -> webp when only webp is accepted", () => {
        expect(resolveRequestedFormat("auto", "image/webp,*/*")).toBe("webp");
    });

    it("keeps the original (undefined) for auto when no modern format is accepted", () => {
        expect(resolveRequestedFormat("auto", "image/jpeg,*/*")).toBeUndefined();
        expect(resolveRequestedFormat("auto", undefined)).toBeUndefined();
    });
});

describe("clampQuality", () => {
    it("clamps into 1-100 and rounds", () => {
        expect(clampQuality(150)).toBe(100);
        expect(clampQuality(0)).toBe(1);
        expect(clampQuality(74.6)).toBe(75);
    });

    it("returns undefined for absent/invalid values", () => {
        expect(clampQuality(undefined)).toBeUndefined();
        expect(clampQuality(NaN)).toBeUndefined();
    });
});

describe("content type helpers", () => {
    it("maps format -> content type", () => {
        expect(contentTypeForFormat("webp")).toBe("image/webp");
        expect(contentTypeForFormat("avif")).toBe("image/avif");
    });

    it("maps content type -> format", () => {
        expect(formatFromContentType("image/jpg")).toBe("jpeg");
        expect(formatFromContentType("image/png")).toBe("png");
        expect(formatFromContentType("image/svg+xml")).toBeUndefined();
    });
});

describe("transformImageBuffer", () => {
    const makeJpeg = (size: number) =>
        sharp({
            create: {
                width: size,
                height: size,
                channels: 3,
                background: { r: 200, g: 100, b: 50 }
            }
        })
            .jpeg()
            .toBuffer();

    it("converts to the requested format and reports its content type", async () => {
        const source = await makeJpeg(200);
        const result = await transformImageBuffer({
            buffer: source,
            animated: false,
            sourceContentType: "image/jpeg",
            widths: [100, 200],
            options: { format: "webp" }
        });

        expect(result.contentType).toBe("image/webp");
        const meta = await sharp(result.buffer).metadata();
        expect(meta.format).toBe("webp");
    });

    it("resizes to the nearest width in the ladder", async () => {
        const source = await makeJpeg(200);
        const result = await transformImageBuffer({
            buffer: source,
            animated: false,
            sourceContentType: "image/jpeg",
            widths: [50, 100],
            options: { width: 60, format: "webp" }
        });

        const meta = await sharp(result.buffer).metadata();
        // getClosestOrMax(60) with [50,100] -> 100.
        expect(meta.width).toBe(100);
    });

    it("leaves the buffer in its source format when neither format nor quality is set", async () => {
        const source = await makeJpeg(120);
        const result = await transformImageBuffer({
            buffer: source,
            animated: false,
            sourceContentType: "image/jpeg",
            widths: [100, 200],
            options: { width: 100 }
        });

        expect(result.contentType).toBe("image/jpeg");
        const meta = await sharp(result.buffer).metadata();
        expect(meta.format).toBe("jpeg");
        expect(meta.width).toBe(100);
    });
});

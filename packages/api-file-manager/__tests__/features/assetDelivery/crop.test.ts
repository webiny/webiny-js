import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { getCropSignature, getImageKey } from "~/features/assetDelivery/transformation/utils.js";
import { cropImageBuffer } from "~/features/assetDelivery/transformation/transformImage.js";

const KEY = "tenants/root/files/685abc/photo.jpg";

describe("getCropSignature", () => {
    it("is undefined for no crop or a full (no-op) crop", () => {
        expect(getCropSignature(undefined)).toBeUndefined();
        expect(getCropSignature({ top: 0, left: 0, bottom: 0, right: 0 })).toBeUndefined();
    });

    it("is a stable, crop-specific signature", () => {
        const a = getCropSignature({ top: 0.1, left: 0.1, bottom: 0.1, right: 0.1 });
        const b = getCropSignature({ top: 0.1, left: 0.1, bottom: 0.1, right: 0.1 });
        const c = getCropSignature({ top: 0.2, left: 0, bottom: 0, right: 0 });
        expect(a).toBeTruthy();
        expect(a).toBe(b);
        expect(a).not.toBe(c);
    });
});

describe("getImageKey with a crop signature", () => {
    it("keeps the original key when there is no crop (backward compatible)", () => {
        expect(getImageKey({ key: KEY })).toBe("tenants/root/files/685abc/optimized/photo.jpg");
        expect(getImageKey({ key: KEY, transformations: { width: 800 } })).toMatch(
            /^tenants\/root\/files\/685abc\/optimized\/[a-f0-9]+-photo\.jpg$/
        );
    });

    it("namespaces the key under the crop signature when cropped", () => {
        expect(getImageKey({ key: KEY, cropSignature: "sig123" })).toBe(
            "tenants/root/files/685abc/optimized/sig123/photo.jpg"
        );
        expect(
            getImageKey({ key: KEY, transformations: { width: 800 }, cropSignature: "sig123" })
        ).toMatch(/^tenants\/root\/files\/685abc\/optimized\/sig123\/[a-f0-9]+-photo\.jpg$/);
    });
});

describe("cropImageBuffer", () => {
    const makeJpeg = (w: number, h: number) =>
        sharp({ create: { width: w, height: h, channels: 3, background: { r: 10, g: 20, b: 30 } } })
            .jpeg()
            .toBuffer();

    it("extracts the crop region", async () => {
        const source = await makeJpeg(200, 200);
        const out = await cropImageBuffer(source, {
            top: 0.25,
            left: 0.25,
            bottom: 0.25,
            right: 0.25
        });
        const meta = await sharp(out).metadata();
        expect(meta.width).toBe(100);
        expect(meta.height).toBe(100);
    });

    it("returns the original buffer for a full (no-op) crop", async () => {
        const source = await makeJpeg(120, 80);
        const out = await cropImageBuffer(source, { top: 0, left: 0, bottom: 0, right: 0 });
        expect(out).toBe(source);
    });

    it("handles asymmetric crops", async () => {
        const source = await makeJpeg(1000, 500);
        // left 0.1, right 0.1 -> width 0.8*1000=800; top 0.2, bottom 0 -> height 0.8*500=400.
        const out = await cropImageBuffer(source, { top: 0.2, left: 0.1, bottom: 0, right: 0.1 });
        const meta = await sharp(out).metadata();
        expect(meta.width).toBe(800);
        expect(meta.height).toBe(400);
    });
});

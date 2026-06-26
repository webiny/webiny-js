import { describe, it, expect } from "vitest";
import { Asset } from "~/delivery/AssetDelivery/Asset.js";
import { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import { NullAssetReply } from "~/features/assetDelivery/NullAssetReply.js";
import { WidthCollection } from "~/features/assetDelivery/transformation/WidthCollection.js";
import { AssetKeyGenerator } from "~/features/assetDelivery/transformation/AssetKeyGenerator.js";
import { CallableContentsReader } from "~/features/assetDelivery/transformation/CallableContentsReader.js";

describe("Asset", () => {
    it("should expose all properties from create()", () => {
        const asset = Asset.create({
            id: "file-1",
            tenant: "root",
            key: "tenants/root/files/file-1/image.jpg",
            size: 1024,
            contentType: "image/jpeg"
        });

        expect(asset).toBeInstanceOf(Asset);
        expect(asset.getId()).toBe("file-1");
        expect(asset.getTenant()).toBe("root");
        expect(asset.getKey()).toBe("tenants/root/files/file-1/image.jpg");
        expect(asset.getSize()).toBe(1024);
        expect(asset.getContentType()).toBe("image/jpeg");
        expect(asset.getExtension()).toBe("jpg");
    });

    it("should clone with new props while preserving contents reader", async () => {
        const asset = Asset.create({
            id: "file-1",
            tenant: "root",
            key: "image.jpg",
            size: 1024,
            contentType: "image/jpeg"
        });

        asset.setContentsReader({ read: async () => Buffer.from("hello") });

        const cloned = asset.clone();
        expect(cloned.getId()).toBe("file-1");
        expect(cloned.getSize()).toBe(1024);

        const contents = await cloned.getContents();
        expect(contents.toString()).toBe("hello");
    });

    it("should create a copy with overridden props via withProps", () => {
        const original = Asset.create({
            id: "file-1",
            tenant: "root",
            key: "image.jpg",
            size: 1024,
            contentType: "image/jpeg"
        });

        const modified = original.withProps({ size: 512 });
        expect(modified.getSize()).toBe(512);
        expect(modified.getId()).toBe("file-1");
        expect(original.getSize()).toBe(1024);
    });

    it("should throw when getContents is called without a reader", () => {
        const asset = Asset.create({
            id: "file-1",
            tenant: "root",
            key: "image.jpg",
            size: 1024,
            contentType: "image/jpeg"
        });

        expect(() => asset.getContents()).toThrow("Asset contents reader was not configured!");
    });

    it("should throw when output is called without a strategy", () => {
        const asset = Asset.create({
            id: "file-1",
            tenant: "root",
            key: "image.jpg",
            size: 1024,
            contentType: "image/jpeg"
        });

        expect(() => asset.output()).toThrow("Asset output strategy was not configured!");
    });

    it("should output via the configured output strategy", async () => {
        const asset = Asset.create({
            id: "file-1",
            tenant: "root",
            key: "image.jpg",
            size: 1024,
            contentType: "image/jpeg"
        });

        asset.setOutputStrategy({
            output: async () => AssetReply.create({ code: 200, body: () => "streamed" })
        });

        const reply = await asset.output();
        expect(reply.getCode()).toBe(200);
        expect(await reply.getBody()).toBe("streamed");
    });

    it("should support setter function for output strategy", () => {
        const asset = Asset.create({
            id: "file-1",
            tenant: "root",
            key: "image.jpg",
            size: 1024,
            contentType: "image/jpeg"
        });

        const strategy = { output: async () => AssetReply.create({ code: 301 }) };
        asset.setOutputStrategy(prev => {
            expect(prev).toBeUndefined();
            return strategy;
        });
    });
});

describe("AssetRequest", () => {
    it("should expose all properties from create()", () => {
        const request = AssetRequest.create({
            key: "file-1/image.jpg",
            context: { url: "/files/file-1/image.jpg" },
            options: { original: false, width: 200 }
        });

        expect(request).toBeInstanceOf(AssetRequest);
        expect(request.getKey()).toBe("file-1/image.jpg");
        expect(request.getOptions()).toEqual({ original: false, width: 200 });
        expect(request.getContext().url).toBe("/files/file-1/image.jpg");
        expect(request.getExtension()).toBe("jpg");
    });

    it("should allow setting options", () => {
        const request = AssetRequest.create({
            key: "image.png",
            context: { url: "/files/image.png" },
            options: { original: false }
        });

        request.setOptions({ original: true, width: 400 });
        expect(request.getOptions().original).toBe(true);
        expect(request.getOptions().width).toBe(400);
    });
});

describe("AssetReply", () => {
    it("should create a reply with defaults", async () => {
        const reply = AssetReply.create();

        expect(reply.getCode()).toBe(200);
        expect(await reply.getBody()).toBe("");
    });

    it("should create a reply with custom code and body", async () => {
        const reply = AssetReply.create({
            code: 404,
            body: () => "not found"
        });

        expect(reply.getCode()).toBe(404);
        expect(await reply.getBody()).toBe("not found");
    });

    it("should allow mutating code, headers, and body", async () => {
        const reply = AssetReply.create();

        reply.setCode(301);
        expect(reply.getCode()).toBe(301);

        reply.setBody(() => "redirect");
        expect(await reply.getBody()).toBe("redirect");
    });

    it("should support header manipulation", () => {
        const reply = AssetReply.create();

        reply.setHeaders(headers => {
            headers.set("x-custom", "value");
            return headers;
        });

        expect(reply.getHeaders().getHeaders()["x-custom"]).toBe("value");
    });
});

describe("NullAssetReply", () => {
    it("should return a 404 reply with error message", async () => {
        const reply = NullAssetReply.instance();

        expect(reply).toBeInstanceOf(AssetReply);
        expect(reply.getCode()).toBe(404);
        const body = (await reply.getBody()) as { error: string };
        expect(body.error).toBe("Asset output strategy is not implemented!");
    });
});

describe("WidthCollection", () => {
    it("should return the closest width >= the given value", () => {
        const widths = WidthCollection.create([100, 200, 400, 800, 1600]);

        expect(widths.getClosestOrMax(150)).toBe(200);
        expect(widths.getClosestOrMax(200)).toBe(200);
        expect(widths.getClosestOrMax(801)).toBe(1600);
    });

    it("should return max when value exceeds all widths", () => {
        const widths = WidthCollection.create([100, 200, 400]);

        expect(widths.getClosestOrMax(500)).toBe(400);
    });

    it("should return max when no value is provided", () => {
        const widths = WidthCollection.create([100, 200, 400]);

        expect(widths.getClosestOrMax(undefined)).toBe(400);
    });

    it("should return min correctly", () => {
        const widths = WidthCollection.create([400, 100, 200]);

        expect(widths.min()).toBe(100);
        expect(widths.max()).toBe(400);
    });
});

describe("AssetKeyGenerator", () => {
    it("should generate an optimized image key", () => {
        const asset = Asset.create({
            id: "file-1",
            tenant: "root",
            key: "tenants/root/files/file-1/image.jpg",
            size: 1024,
            contentType: "image/jpeg"
        });

        const generator = AssetKeyGenerator.create(asset);
        const key = generator.getOptimizedImageKey();

        expect(key).toBe("tenants/root/files/file-1/optimized/image.jpg");
    });

    it("should generate a transformed image key with hash", () => {
        const asset = Asset.create({
            id: "file-1",
            tenant: "root",
            key: "tenants/root/files/file-1/image.jpg",
            size: 1024,
            contentType: "image/jpeg"
        });

        const generator = AssetKeyGenerator.create(asset);
        const key = generator.getTransformedImageKey({ width: 200 });

        expect(key).toContain("tenants/root/files/file-1/optimized/");
        expect(key).toContain("image.jpg");
        expect(key).not.toBe("tenants/root/files/file-1/optimized/image.jpg");
    });

    it("should produce deterministic keys for the same transformations", () => {
        const asset = Asset.create({
            id: "file-1",
            tenant: "root",
            key: "tenants/root/files/file-1/image.jpg",
            size: 1024,
            contentType: "image/jpeg"
        });

        const gen1 = AssetKeyGenerator.create(asset);
        const gen2 = AssetKeyGenerator.create(asset);

        expect(gen1.getTransformedImageKey({ width: 200 })).toBe(
            gen2.getTransformedImageKey({ width: 200 })
        );
    });

    it("should produce different keys for different transformations", () => {
        const asset = Asset.create({
            id: "file-1",
            tenant: "root",
            key: "tenants/root/files/file-1/image.jpg",
            size: 1024,
            contentType: "image/jpeg"
        });

        const generator = AssetKeyGenerator.create(asset);

        expect(generator.getTransformedImageKey({ width: 200 })).not.toBe(
            generator.getTransformedImageKey({ width: 400 })
        );
    });
});

describe("CallableContentsReader", () => {
    it("should return buffer from sync callable", async () => {
        const reader = CallableContentsReader.create(() => Buffer.from("sync-data"));
        const result = await reader.read();
        expect(result.toString()).toBe("sync-data");
    });

    it("should return buffer from async callable", async () => {
        const reader = CallableContentsReader.create(async () => Buffer.from("async-data"));
        const result = await reader.read();
        expect(result.toString()).toBe("async-data");
    });
});

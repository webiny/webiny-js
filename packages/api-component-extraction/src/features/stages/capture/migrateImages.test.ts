import { describe, expect, it, vi } from "vitest";
import type { CapturedImage } from "@webiny/site-capture";
import { migrateImages, type MigrateImagesDeps } from "./migrateImages.js";
import { assetKey, assetUrlKey } from "~/domain/assets.js";

const image = (overrides: Partial<CapturedImage> = {}): CapturedImage => ({
    url: "https://res.cloudinary.com/g5/image/upload/hero.jpg",
    contentType: "image/webp",
    sha256: "a".repeat(64),
    bytes: new Uint8Array([1, 2, 3]),
    size: 3,
    embedded: false,
    ...overrides
});

const deps = (overrides: Partial<MigrateImagesDeps> = {}) => {
    const store = new Map<string, unknown>();
    const uploaded: Array<{ id: string; key: string }> = [];

    const base: MigrateImagesDeps = {
        store: {
            get: async <T>(key: string) => ({ value: (store.get(key) ?? null) as T | null }),
            set: async (key, value) => {
                store.set(key, value);
            }
        },
        uploadBatch: async files => {
            for (const file of files) {
                uploaded.push({ id: file.id, key: file.key });
            }
            return files.map(file => ({ id: file.id, key: file.key }));
        },
        fileExists: async () => true,
        urlOf: async fileKey => `https://cdn.webiny/${fileKey}`,
        log: async () => undefined,
        ...overrides
    };

    return { deps: base, store, uploaded };
};

describe("migrateImages", () => {
    it("uploads a new image and records where it went", async () => {
        const { deps: d, store, uploaded } = deps();
        const outcomes = await migrateImages(d, [image()]);

        expect(uploaded).toHaveLength(1);
        expect(outcomes).toHaveLength(1);
        expect(outcomes[0]).toMatchObject({
            kind: "migrated",
            sourceUrl: "https://res.cloudinary.com/g5/image/upload/hero.jpg",
            sha256: "a".repeat(64)
        });
        // Keyed `${id}/${filename}`, so File Manager derives the id it was given.
        expect(uploaded[0].key.startsWith(`${uploaded[0].id}/`)).toBe(true);
        expect(store.has(assetKey("a".repeat(64)))).toBe(true);
        expect(store.has(assetUrlKey(image().url))).toBe(true);
    });

    it("keeps the source url in the map entry, so a re-encode is recognisable", async () => {
        const { deps: d, store } = deps();
        await migrateImages(d, [image()]);

        expect(store.get(assetKey("a".repeat(64)))).toMatchObject({
            sourceUrl: "https://res.cloudinary.com/g5/image/upload/hero.jpg"
        });
    });

    it("reuses by url without downloading or uploading again", async () => {
        const { deps: d, uploaded } = deps();
        await migrateImages(d, [image()]);
        const outcomes = await migrateImages(d, [image()]);

        expect(uploaded).toHaveLength(1);
        expect(outcomes[0]).toMatchObject({ kind: "deduplicated", by: "url" });
    });

    it("reuses by content when the same bytes arrive at a different url", async () => {
        const { deps: d, uploaded } = deps();
        await migrateImages(d, [image()]);
        const outcomes = await migrateImages(d, [
            image({ url: "https://res.cloudinary.com/g5/image/upload/w_200/hero.jpg" })
        ]);

        expect(uploaded).toHaveLength(1);
        expect(outcomes[0]).toMatchObject({ kind: "deduplicated", by: "content" });
    });

    it("uploads one file when the same image appears many times in one run", async () => {
        const { deps: d, uploaded } = deps();
        const outcomes = await migrateImages(d, [image(), image(), image()]);

        expect(uploaded).toHaveLength(1);
        expect(outcomes.filter(o => o.kind === "migrated")).toHaveLength(1);
        expect(outcomes.filter(o => o.kind === "deduplicated")).toHaveLength(2);
    });

    it("re-uploads when the map points at a file that no longer exists", async () => {
        const { deps: d, uploaded } = deps();
        await migrateImages(d, [image()]);

        const gone = { ...d, fileExists: async () => false };
        const outcomes = await migrateImages(gone, [image()]);

        expect(uploaded).toHaveLength(2);
        expect(outcomes[0]).toMatchObject({ kind: "migrated" });
    });

    it("leaves an embedded image alone", async () => {
        const { deps: d, uploaded } = deps();
        const outcomes = await migrateImages(d, [
            image({ url: "https://maps.gstatic.com/tile.png", embedded: true })
        ]);

        expect(uploaded).toHaveLength(0);
        expect(outcomes[0]).toMatchObject({ kind: "external" });
    });

    it("records every image in a failed batch rather than losing them", async () => {
        const { deps: d } = deps({
            uploadBatch: async () => {
                throw new Error("File Manager unavailable");
            }
        });
        const outcomes = await migrateImages(d, [
            image(),
            image({ url: "https://cdn/b.jpg", sha256: "b".repeat(64) })
        ]);

        expect(outcomes).toHaveLength(2);
        expect(outcomes.every(o => o.kind === "unmigrated")).toBe(true);
        expect(outcomes[0]).toMatchObject({
            reason: expect.stringContaining("File Manager unavailable")
        });
    });

    it("records an image the batch silently did not create", async () => {
        const { deps: d } = deps({ uploadBatch: async () => [] });
        const outcomes = await migrateImages(d, [image()]);

        expect(outcomes[0]).toMatchObject({ kind: "unmigrated" });
    });

    it("uses one batch call for many new images", async () => {
        const uploadBatch = vi.fn(async (files: Array<{ id: string; key: string }>) =>
            files.map(f => ({ id: f.id, key: f.key }))
        );
        const { deps: d } = deps({ uploadBatch: uploadBatch as MigrateImagesDeps["uploadBatch"] });

        await migrateImages(d, [
            image({ sha256: "1".repeat(64), url: "https://cdn/1.jpg" }),
            image({ sha256: "2".repeat(64), url: "https://cdn/2.jpg" }),
            image({ sha256: "3".repeat(64), url: "https://cdn/3.jpg" })
        ]);

        expect(uploadBatch).toHaveBeenCalledTimes(1);
        expect(uploadBatch.mock.calls[0][0]).toHaveLength(3);
    });
});

import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createImageCollector, type ImageResponse } from "./collectPageImages.js";

const response = (
    url: string,
    bytes: Uint8Array | null,
    contentType = "image/jpeg",
    error?: string
): ImageResponse => ({
    url: () => url,
    headers: () => ({ "content-type": contentType }),
    buffer: async () => {
        if (error) {
            throw new Error(error);
        }
        return bytes as Uint8Array;
    }
});

const bytes = (length: number, fill = 1): Uint8Array => new Uint8Array(length).fill(fill);

describe("createImageCollector", () => {
    it("collects an image with the sha256 of its decoded bytes", async () => {
        const body = bytes(64, 7);
        const collector = createImageCollector({ maxTotalBytes: 1000 });
        await collector.offer(response("https://cdn/a.jpg", body));
        const { images, skipped } = await collector.drain();

        expect(skipped).toEqual([]);
        expect(images).toHaveLength(1);
        expect(images[0].sha256).toBe(createHash("sha256").update(body).digest("hex"));
        expect(images[0].size).toBe(64);
        expect(images[0].contentType).toBe("image/jpeg");
    });

    it("records an image that would cross the page ceiling instead of dropping it", async () => {
        const collector = createImageCollector({ maxTotalBytes: 100 });
        await collector.offer(response("https://cdn/small.jpg", bytes(60)));
        await collector.offer(response("https://cdn/big.jpg", bytes(80)));
        const { images, skipped } = await collector.drain();

        expect(images.map(image => image.url)).toEqual(["https://cdn/small.jpg"]);
        expect(skipped).toEqual([
            {
                url: "https://cdn/big.jpg",
                reason: "page-byte-ceiling",
                detail: "80 bytes would pass the 100-byte page ceiling"
            }
        ]);
    });

    it("records an unreadable body rather than failing the page", async () => {
        const collector = createImageCollector({ maxTotalBytes: 1000 });
        await collector.offer(response("https://cdn/gone.jpg", null, "image/png", "No data found"));
        const { images, skipped } = await collector.drain();

        expect(images).toEqual([]);
        expect(skipped[0]).toMatchObject({ url: "https://cdn/gone.jpg", reason: "unreadable" });
    });

    it("skips a data URI, which is already the bytes", async () => {
        const collector = createImageCollector({ maxTotalBytes: 1000 });
        await collector.offer(response("data:image/png;base64,AAAA", bytes(10)));
        const { images, skipped } = await collector.drain();

        expect(images).toEqual([]);
        expect(skipped).toEqual([]);
    });

    it("records a response that is not an image, with its status", async () => {
        // A 204 with no content-type is an analytics beacon, not a picture. The status is what makes
        // that recognisable downstream, where it decides whether the image counts as a lost asset.
        const beacon: ImageResponse = {
            url: () => "https://bat.bing.net/action/0",
            headers: () => ({}),
            buffer: async () => bytes(0),
            status: () => 204
        };

        const collector = createImageCollector({ maxTotalBytes: 1000 });
        await collector.offer(beacon);
        const { images, skipped } = await collector.drain();

        expect(images).toEqual([]);
        expect(skipped[0]).toMatchObject({
            url: "https://bat.bing.net/action/0",
            reason: "not-an-image",
            detail: "(no content-type)",
            status: 204
        });
    });

    it("fetches one URL once, however many times the page requests it", async () => {
        const collector = createImageCollector({ maxTotalBytes: 1000 });
        let reads = 0;
        const counted: ImageResponse = {
            url: () => "https://cdn/logo.png",
            headers: () => ({ "content-type": "image/png" }),
            buffer: async () => {
                reads++;
                return bytes(20);
            }
        };

        await collector.offer(counted);
        await collector.offer(counted);
        await collector.offer(counted);
        const { images } = await collector.drain();

        expect(reads).toBe(1);
        expect(images).toHaveLength(1);
    });

    it("holds no more than maxConcurrent bodies at once", async () => {
        let inFlight = 0;
        let peak = 0;
        const slow = (url: string): ImageResponse => ({
            url: () => url,
            headers: () => ({ "content-type": "image/webp" }),
            buffer: async () => {
                inFlight++;
                peak = Math.max(peak, inFlight);
                await new Promise(resolve => setTimeout(resolve, 5));
                inFlight--;
                return bytes(8);
            }
        });

        const collector = createImageCollector({ maxTotalBytes: 10_000, maxConcurrent: 2 });
        await Promise.all(
            Array.from({ length: 8 }, (_, index) =>
                collector.offer(slow(`https://cdn/${index}.webp`))
            )
        );
        const { images } = await collector.drain();

        expect(images).toHaveLength(8);
        expect(peak).toBeLessThanOrEqual(2);
    });
});

import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { placeTiles, planTiles, stitchTiles } from "./stitch.js";

const solid = async (width: number, height: number, r: number, g: number, b: number) =>
    new Uint8Array(
        await sharp({ create: { width, height, channels: 3, background: { r, g, b } } })
            .png()
            .toBuffer()
    );

const pixelAt = async (png: Uint8Array, x: number, y: number) => {
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const offset = (y * info.width + x) * info.channels;
    return [data[offset], data[offset + 1], data[offset + 2]];
};

describe("planTiles", () => {
    it("covers the document in viewport steps", () => {
        expect(planTiles(2000, 900, 32000)).toEqual({ offsets: [0, 900, 1800], height: 2000 });
    });

    it("shoots one tile for a page no taller than the viewport", () => {
        expect(planTiles(600, 900, 32000)).toEqual({ offsets: [0], height: 900 });
    });

    it("shoots one tile when the height could not be measured", () => {
        expect(planTiles(0, 900, 32000)).toEqual({ offsets: [0], height: 900 });
        expect(planTiles(Number.NaN, 900, 32000)).toEqual({ offsets: [0], height: 900 });
    });

    it("cuts a page taller than the cap and records how tall it was", () => {
        const plan = planTiles(40000, 900, 32000);
        expect(plan.height).toBe(32000);
        expect(plan.truncatedAt).toBe(40000);
        expect(plan.offsets[plan.offsets.length - 1]).toBeLessThan(32000);
        expect(plan.offsets).toHaveLength(Math.ceil(32000 / 900));
    });
});

describe("placeTiles", () => {
    it("draws the first tile last, so it wins where the clamped last tile overlaps it", () => {
        const placed = placeTiles(
            [
                { top: 0, bytes: new Uint8Array([1]) },
                { top: 400, bytes: new Uint8Array([2]) }
            ],
            900,
            1300
        );
        expect(placed.map(tile => tile.top)).toEqual([400, 0]);
        expect(placed.map(tile => tile.rows)).toEqual([900, 900]);
    });

    it("trims a tile that runs past the image and drops one that starts beyond it", () => {
        const placed = placeTiles(
            [
                { top: 0, bytes: new Uint8Array([1]) },
                { top: 900, bytes: new Uint8Array([2]) },
                { top: 1800, bytes: new Uint8Array([3]) }
            ],
            900,
            1500
        );
        expect(placed).toEqual([
            { top: 900, rows: 600, bytes: new Uint8Array([2]) },
            { top: 0, rows: 900, bytes: new Uint8Array([1]) }
        ]);
    });
});

describe("stitchTiles", () => {
    it("places each tile at its scroll offset", async () => {
        const red = await solid(100, 50, 255, 0, 0);
        const blue = await solid(100, 50, 0, 0, 255);

        const image = await stitchTiles(
            placeTiles(
                [
                    { top: 0, bytes: red },
                    { top: 50, bytes: blue }
                ],
                50,
                100
            ),
            100,
            100
        );

        const meta = await sharp(image).metadata();
        expect([meta.width, meta.height]).toEqual([100, 100]);
        expect(await pixelAt(image, 10, 10)).toEqual([255, 0, 0]);
        expect(await pixelAt(image, 10, 75)).toEqual([0, 0, 255]);
    });

    it("keeps the first tile where the clamped last tile overlaps it", async () => {
        const first = await solid(100, 50, 255, 0, 0);
        const last = await solid(100, 50, 0, 255, 0);

        // A 70px page: the last scroll clamps to 20, so rows 20-49 are in both tiles.
        const image = await stitchTiles(
            placeTiles(
                [
                    { top: 0, bytes: first },
                    { top: 20, bytes: last }
                ],
                50,
                70
            ),
            100,
            70
        );

        expect(await pixelAt(image, 10, 30)).toEqual([255, 0, 0]);
        expect(await pixelAt(image, 10, 60)).toEqual([0, 255, 0]);
    });

    it("cuts a tile that runs past the bottom of the image", async () => {
        const tile = await solid(100, 50, 0, 0, 255);
        const image = await stitchTiles(placeTiles([{ top: 0, bytes: tile }], 50, 30), 100, 30);
        const meta = await sharp(image).metadata();
        expect(meta.height).toBe(30);
    });
});

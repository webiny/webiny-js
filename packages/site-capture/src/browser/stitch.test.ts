import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { JSDOM } from "jsdom";
import {
    placeTiles,
    planTiles,
    restoreShiftScript,
    shiftScript,
    stitchTiles,
    tileShift
} from "./stitch.js";

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

describe("tileShift", () => {
    it("shifts by the offset until the last full viewport of the page", () => {
        expect(tileShift(0, 2000, 900)).toBe(0);
        expect(tileShift(900, 2000, 900)).toBe(900);
        expect(tileShift(1800, 2000, 900)).toBe(1100);
    });

    it("never shifts a page shorter than the viewport", () => {
        expect(tileShift(0, 600, 900)).toBe(0);
    });
});

describe("shiftScript and restoreShiftScript", () => {
    const run = (dom: JSDOM, script: string) => dom.window.eval(script);

    it("moves the page with a transform on body, without scrolling it", () => {
        const dom = new JSDOM("<body><main>page</main></body>", { runScripts: "outside-only" });
        let scrolled = 0;
        dom.window.addEventListener("scroll", () => scrolled++);
        dom.window.scrollTo = () => undefined;
        run(dom, shiftScript(900));
        expect(dom.window.document.body.style.getPropertyValue("transform")).toBe(
            "translateY(-900px)"
        );
        expect(dom.window.document.body.style.getPropertyPriority("transform")).toBe("important");
        expect(scrolled).toBe(0);
    });

    it("puts back the page's own inline transform afterwards", () => {
        const dom = new JSDOM('<body style="transform: scale(1)"><main>page</main></body>', {
            runScripts: "outside-only"
        });
        dom.window.scrollTo = () => undefined;
        run(dom, shiftScript(900));
        run(dom, shiftScript(1800));
        run(dom, restoreShiftScript());
        expect(dom.window.document.body.style.getPropertyValue("transform")).toBe("scale(1)");
        expect(dom.window.document.body.hasAttribute("data-wby-capture-transform")).toBe(false);
    });

    it("removes the transform it added when the page had none", () => {
        const dom = new JSDOM("<body><main>page</main></body>", { runScripts: "outside-only" });
        dom.window.scrollTo = () => undefined;
        run(dom, shiftScript(450));
        run(dom, restoreShiftScript());
        expect(dom.window.document.body.style.getPropertyValue("transform")).toBe("");
    });
});

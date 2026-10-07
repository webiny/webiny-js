import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CapturedNode } from "~/domain/artifacts.js";
import { paintedBox } from "./paintedBox.js";

// Header sections captured from the live sites with the current evaluator.
const fixture = (name: string): CapturedNode =>
    JSON.parse(readFileSync(new URL(`./__fixtures__/${name}.json`, import.meta.url), "utf8"));

describe("paintedBox", () => {
    it("reaches past the box to a logo that hangs out of it", () => {
        // Freehill's header is 70px; its logo is positioned 53px below into the hero.
        const header = fixture("freehill-header");
        expect(header.box).toEqual({ x: 0, y: 43, width: 1440, height: 70 });
        expect(paintedBox(header, 1440)).toEqual({ x: 0, y: 43, width: 1440, height: 135 });
    });

    it("does not reach into a clipping dropdown that shows nothing", () => {
        // Park City's "Contact us" submenu: an absolute, overflow-hidden box 65px below the header,
        // its items hidden.
        expect(paintedBox(fixture("parkcity-header"), 1440)).toBeNull();
    });

    it("is bounded, and nothing for a section that clips itself", () => {
        const stray = (overflow: string): CapturedNode => ({
            tag: "section",
            box: { x: 0, y: 1000, width: 1440, height: 200 },
            styles: { overflow },
            children: [
                {
                    tag: "img",
                    box: { x: 0, y: 1800, width: 100, height: 100 },
                    styles: { position: "absolute" },
                    children: [],
                    src: "https://example.com/off-canvas.png"
                }
            ]
        });
        expect(paintedBox(stray("visible"), 1440)?.height).toBe(200 + 300);
        expect(paintedBox(stray("hidden"), 1440)).toBeNull();
    });
});

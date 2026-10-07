import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { CapturedNode } from "~/domain/artifacts.js";
import { measureTone } from "~/features/shared/imageTone.js";
import { isTranslucent } from "~/features/shared/translucency.js";
import { findNodeByBox } from "./sectionNode.js";
import { backdropColour, colourUnderImage, resolveSectionColours } from "./resolvedColours.js";

// Real page trees, pruned to the section and the ancestors above it.
const fixture = (name: string): CapturedNode =>
    JSON.parse(readFileSync(new URL(`./__fixtures__/${name}.tree.json`, import.meta.url), "utf8"));

const seeThrough = (fragment: string) => (url: string) => url.includes(fragment);
const backgrounds = (colours: ReturnType<typeof resolveSectionColours>) =>
    colours.filter(colour => colour.role === "background").map(colour => colour.hex);

describe("see-through background images", () => {
    it("measures Park city's pattern as light and see-through, not dark", async () => {
        // The file itself: white lines at 10-20% opacity, no opaque pixel.
        const tone = await measureTone(
            readFileSync(new URL("./__fixtures__/parkcity-pattern.png", import.meta.url))
        );
        expect(tone).toMatchObject({ tone: "light", transparent: true });
        expect(tone.opacity).toBeCloseTo(0.12, 2);
        expect(isTranslucent(tone)).toBe(true);
    });

    it("gives no tone to a picture that paints nothing", async () => {
        const empty = await sharp({
            create: { width: 8, height: 8, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
        })
            .png()
            .toBuffer();
        const tone = await measureTone(empty);
        expect(tone.tone).toBeUndefined();
        expect(tone.opacity).toBe(0);
    });

    it("finds the light backdrop under Park city's pattern, while navy stays its largest colour", () => {
        const root = fixture("parkcity-property-description");
        const section = findNodeByBox(root, { x: 0, y: 770, width: 1440, height: 640 })!;
        const see = seeThrough("Denver_Background_Tertiary");
        const url = section.background!.url;

        expect(colourUnderImage(root, section, url, null, see)?.hex).toBe("#f7f7f9");
        // Not fully fixed: the navy panel in front of the pattern is drawn by something the capture
        // does not record, so the measured colours still lead with the navy text column.
        expect(
            backgrounds(
                resolveSectionColours(section, null, backdropColour(root, section, see), see)
            )[0]
        ).toBe("#363f54");
    });

    it("keeps 2424 Tulane's pale green under its circles", () => {
        const root = fixture("tulane-property-highlights");
        const section = findNodeByBox(root, { x: 0, y: 864, width: 1440, height: 80 })!;
        const see = seeThrough("circle-background4");

        expect(
            backgrounds(resolveSectionColours(section, null, backdropColour(root, section)))
        ).not.toContain("#dce6e2");
        expect(
            backgrounds(
                resolveSectionColours(section, null, backdropColour(root, section, see), see)
            )[0]
        ).toBe("#dce6e2");
    });

    it("sees thevibe's white page through the texture on its body", () => {
        const root = fixture("thevibe-interior-highlights");
        const section = findNodeByBox(root, { x: 20, y: 805, width: 1400, height: 432 })!;

        expect(backdropColour(root, section)).toBeNull();
        expect(backdropColour(root, section, seeThrough("bg-png.png"))).toBe("#ffffff");
    });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { ThemeManifest } from "@webiny/theme-common";
import type { PlannedComponent } from "~/domain/artifacts.js";
import { parseColour, sectionBackgroundRegions } from "./backgroundRegions.js";
import { buildComponentPrompt, withRematchedColours } from "./componentGeneration.js";

/*
 * Real sections from ParkCity - Take 3's capture (2026-10-10) and its pinned theme's colour slots
 * (multi-region-backgrounds.md).
 */
const fixture = JSON.parse(
    readFileSync(new URL("./__fixtures__/take3-background-regions.json", import.meta.url), "utf8")
);
const theme = JSON.parse(
    readFileSync(
        new URL("../cluster/__fixtures__/pinnedThemeColours.json", import.meta.url),
        "utf8"
    )
).take3 as ThemeManifest;

const regionsOf = (name: string) => {
    const { section, ancestors, backgroundImages } = fixture.sections[name];
    return sectionBackgroundRegions({ section, ancestors, manifest: theme, backgroundImages });
};

describe("background regions", () => {
    it("finds the pattern over the section and the navy panel on top of it", () => {
        const regions = regionsOf("Property Description")!;
        expect(regions).toHaveLength(2);
        expect(regions[0].paint).toMatchObject({ kind: "image" });
        expect(regions[0].box).toEqual({ x: 0, y: 0, width: 100, height: 100 });
        expect(regions[1].paint).toMatchObject({ kind: "colour", hex: "#363f54" });
        expect(regions[1].box.x).toBeGreaterThanOrEqual(45);
        expect(regions[1].share).toBeGreaterThanOrEqual(0.3);
    });

    it("keeps a design two-tone: a white card on the page's light grey", () => {
        const regions = regionsOf("Neighborhood/Location Highlight")!;
        expect(regions.map(region => region.paint.kind === "colour" && region.paint.hex)).toEqual([
            "#f7f7f9",
            "#ffffff"
        ]);
    });

    it("merges the same colour captured twice into one paint", () => {
        // The header's grey is recorded once opaque and once at 0.95 opacity.
        expect(regionsOf("Site Navigation Header")).toBeNull();
    });

    it("gives a section with one background no regions", () => {
        expect(regionsOf("Site Footer")).toBeNull();
    });

    it("reads colours written in oklch, as webiny.com's capture records them", () => {
        expect(parseColour("oklch(0.145 0 0)")).toEqual([
            expect.closeTo(10, 0),
            expect.closeTo(10, 0),
            expect.closeTo(10, 0)
        ]);
        expect(parseColour("rgba(0, 0, 0, 0.5)")).toBeNull();
    });
});

describe("the prompt for a section with regions", () => {
    const slotVariables = new Map(theme.slots.map(slot => [String(slot.path), slot.cssVariables]));
    const planned = (name: string) =>
        withRematchedColours(fixture.planned[name] as PlannedComponent, theme);

    it("replaces the section-wide background facts with the regions", () => {
        const prompt = buildComponentPrompt(
            {
                ...planned("Property Description"),
                backgroundRegions: regionsOf("Property Description")!
            },
            slotVariables
        );
        expect(prompt).toContain("This section's background has 2 regions, listed bottom first.");
        expect(prompt).toContain(
            "- the whole section: a mostly see-through image (about 12% opaque) over var(--wby-color-surface-raised) (#f7f7f9)"
        );
        expect(prompt).toContain(
            "- on top of it, x 50-95%, y 10-90% of the section: a solid var(--wby-color-surface-sunken) (#363f54)"
        );
        // The three section-wide statements it replaces.
        expect(prompt).not.toMatch(/^- section\.background: /m);
        expect(prompt).not.toMatch(/^- background #363f54 /m);
        expect(prompt).not.toContain(
            "This section's background has a mostly see-through image drawn over a colour"
        );
    });

    it("leaves a section with one background exactly as it was", () => {
        const footer = planned("Site Footer");
        expect(
            buildComponentPrompt({ ...footer, backgroundRegions: undefined }, slotVariables)
        ).toBe(buildComponentPrompt(footer, slotVariables));
    });
});

import { describe, expect, it } from "vitest";
import type { ThemeManifest } from "@webiny/theme-common";
import type { CapturedNode } from "~/domain/artifacts.js";
import { resolveSectionColours, themeColourRoles } from "./resolvedColours.js";

const node = (
    styles: Record<string, string>,
    extra: Partial<CapturedNode> = {},
    children: CapturedNode[] = []
): CapturedNode => ({
    tag: "div",
    box: { x: 0, y: 0, width: 100, height: 100 },
    styles,
    children,
    ...extra
});

const theme = (slots: Array<[string, string, string]>): ThemeManifest =>
    ({
        slots: slots.map(([path, variable, hex]) => ({
            path,
            displayName: path,
            description: "",
            cssVariables: [variable],
            values: { light: hex, dark: hex }
        }))
    }) as unknown as ThemeManifest;

const THEME = theme([
    ["color.surface.inverse", "--wby-color-surface-inverse", "#363f54"],
    ["color.text.primary", "--wby-color-text-primary", "#ffffff"]
]);

describe("resolveSectionColours", () => {
    it("keeps the role each colour came from", () => {
        const section = node({ backgroundColor: "rgb(54, 63, 84)" }, {}, [
            node({ color: "rgb(255, 255, 255)" }, { text: "Hello" })
        ]);

        const colours = resolveSectionColours(section, THEME);

        expect(colours.map(c => [c.role, c.hex])).toEqual([
            ["background", "#363f54"],
            ["text", "#ffffff"]
        ]);
    });

    it("resolves a colour to the theme token that expresses it", () => {
        const section = node({ backgroundColor: "rgb(54, 63, 84)" });
        expect(resolveSectionColours(section, THEME)[0].token).toEqual({
            path: "color.surface.inverse",
            cssVariable: "--wby-color-surface-inverse",
            hex: "#363f54"
        });
    });

    it("reports no token rather than rounding to the nearest one", () => {
        // Forcing a measured colour onto the closest palette entry is the defect being fixed, so a
        // colour the theme cannot express has to come back null and be reported.
        const section = node({ backgroundColor: "rgb(200, 30, 30)" });
        expect(resolveSectionColours(section, THEME)[0].token).toBeNull();
    });

    it("orders by area, so a background outranks a swatch", () => {
        const section = node({}, {}, [
            node(
                { backgroundColor: "rgb(54, 63, 84)" },
                { box: { x: 0, y: 0, width: 1440, height: 600 } }
            ),
            node(
                { backgroundColor: "rgb(255, 255, 255)" },
                { box: { x: 0, y: 0, width: 20, height: 20 } }
            )
        ]);

        expect(resolveSectionColours(section, THEME).map(c => c.hex)).toEqual([
            "#363f54",
            "#ffffff"
        ]);
    });

    it("ignores a transparent background, which is the absence of a colour", () => {
        const section = node({ backgroundColor: "rgba(0, 0, 0, 0)" });
        expect(resolveSectionColours(section, THEME)).toEqual([]);
    });

    it("counts a text colour only where there is text", () => {
        // Every node inherits `color`; counting them all would make body text the largest thing on the
        // page by area and say nothing about the section.
        const section = node({ color: "rgb(255, 255, 255)" }, {}, [
            node({ color: "rgb(255, 255, 255)" })
        ]);
        expect(resolveSectionColours(section, THEME)).toEqual([]);
    });

    it("counts a border colour only where there is a border", () => {
        const withoutWidth = node({ borderTopColor: "rgb(54, 63, 84)", borderTopWidth: "0px" });
        expect(resolveSectionColours(withoutWidth, THEME)).toEqual([]);

        const withWidth = node({ borderTopColor: "rgb(54, 63, 84)", borderTopWidth: "2px" });
        expect(resolveSectionColours(withWidth, THEME)[0].role).toBe("border");
    });

    it("works with no manifest, reporting every colour as untokenised", () => {
        const section = node({ backgroundColor: "rgb(54, 63, 84)" });
        expect(resolveSectionColours(section, null)[0].token).toBeNull();
    });
});

describe("themeColourRoles", () => {
    it("reads colour slots and skips non-colour ones", () => {
        const mixed = theme([["color.surface.inverse", "--wby-color-surface-inverse", "#363f54"]]);
        (mixed as unknown as { slots: unknown[] }).slots.push({
            path: "type.body",
            cssVariables: ["--wby-type-body-size"],
            values: { light: { fontSize: "1rem" } }
        });
        expect(themeColourRoles(mixed).map(r => r.path)).toEqual(["color.surface.inverse"]);
    });
});

describe("role-aware token matching", () => {
    const SHARED_WHITE = theme([
        ["color.surface.page", "--wby-color-surface-page", "#ffffff"],
        ["color.text.on-inverse", "--wby-color-text-on-inverse", "#ffffff"]
    ]);

    it("prefers a token whose family matches the role", () => {
        // Both slots are #ffffff; white TEXT must not resolve to a surface token just because it came
        // first in the palette.
        const section = node({ color: "rgb(255, 255, 255)" }, { text: "Hello" });
        expect(resolveSectionColours(section, SHARED_WHITE)[0].token?.path).toBe(
            "color.text.on-inverse"
        );

        const surface = node({ backgroundColor: "rgb(255, 255, 255)" });
        expect(resolveSectionColours(surface, SHARED_WHITE)[0].token?.path).toBe(
            "color.surface.page"
        );
    });

    it("falls back to another family rather than to a hardcoded hex", () => {
        // A token of the wrong family at the right colour still survives a theme change; a hex does not.
        const onlySurface = theme([["color.surface.page", "--wby-color-surface-page", "#ffffff"]]);
        const section = node({ color: "rgb(255, 255, 255)" }, { text: "Hello" });
        expect(resolveSectionColours(section, onlySurface)[0].token?.path).toBe(
            "color.surface.page"
        );
    });
});

describe("a colour under a background image", () => {
    it("is not reported, because the page never shows it", () => {
        // Park city's hero: a dark blue photograph over `background-color: #a65f46`. The fallback was
        // the largest painted colour in the section, so the model was told to paint the whole hero
        // terracotta.
        const section: CapturedNode = {
            tag: "div",
            box: { x: 0, y: 0, width: 1440, height: 484 },
            styles: { backgroundColor: "rgb(166, 95, 70)" },
            background: { url: "https://example.com/hero.jpg", size: "cover" },
            children: []
        };

        expect(resolveSectionColours(section, THEME)).toEqual([]);
    });

    it("still reports the text and border colours of a node with a background image", () => {
        // Only the colour the image covers is hidden. The text painted on top of it is visible.
        const section: CapturedNode = {
            tag: "div",
            box: { x: 0, y: 0, width: 1440, height: 484 },
            styles: { backgroundColor: "rgb(166, 95, 70)", color: "rgb(255, 255, 255)" },
            background: { url: "https://example.com/hero.jpg" },
            text: "Comfort Is Coming Home",
            children: []
        };

        expect(resolveSectionColours(section, THEME).map(c => [c.role, c.hex])).toEqual([
            ["text", "#ffffff"]
        ]);
    });

    it("reports a sibling's colour that no image covers", () => {
        const section = node({}, {}, [
            {
                tag: "div",
                box: { x: 0, y: 0, width: 1440, height: 400 },
                styles: { backgroundColor: "rgb(166, 95, 70)" },
                background: { url: "https://example.com/hero.jpg" },
                children: []
            },
            node(
                { backgroundColor: "rgb(54, 63, 84)" },
                { box: { x: 0, y: 400, width: 1440, height: 200 } }
            )
        ]);

        expect(resolveSectionColours(section, THEME).map(c => c.hex)).toEqual(["#363f54"]);
    });
});

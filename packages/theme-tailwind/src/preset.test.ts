import { describe, expect, it } from "vitest";
import { CANONICAL_SLOTS } from "@webiny/theme-common";
import { webinyThemePreset, webinyThemeTokens } from "./preset.js";

describe("webinyThemeTokens", () => {
    const tokens = webinyThemeTokens();

    it("binds a colour slot to its CSS variable", () => {
        expect(tokens.colors["surface-page"]).toBe("var(--wby-color-surface-page)");
    });

    it("flattens a deep colour path into a dashed key", () => {
        expect(tokens.colors["action-primary-background"]).toBe(
            "var(--wby-color-action-primary-background)"
        );
    });

    it("binds spacing, font size, radius and shadow to their variables", () => {
        expect(tokens.spacing["md"]).toBe("var(--wby-space-md)");
        expect(tokens.fontSize["lg"]).toBe("var(--wby-text-lg)");
        expect(tokens.borderRadius["sm"]).toBe("var(--wby-radius-sm)");
        expect(tokens.boxShadow["md"]).toBe("var(--wby-shadow-md)");
    });

    it("routes text ramp to fontSize and space ramp to spacing (both are dimension-typed)", () => {
        // The key check that routing is by path prefix, not by token $type.
        expect(tokens.fontSize["md"]).toBe("var(--wby-text-md)");
        expect(tokens.spacing["md"]).toBe("var(--wby-space-md)");
        expect(tokens.fontSize["md"]).not.toBe(tokens.spacing["md"]);
    });

    it("excludes the composite typography roles", () => {
        // type.* is five properties at once, not a Tailwind scale.
        const values = [
            ...Object.values(tokens.colors),
            ...Object.values(tokens.spacing),
            ...Object.values(tokens.fontSize),
            ...Object.values(tokens.borderRadius),
            ...Object.values(tokens.boxShadow)
        ];
        expect(values.some(v => v.includes("--wby-type-"))).toBe(false);
    });

    it("binds every canonical slot except the typography roles, and nothing else", () => {
        const bound =
            Object.keys(tokens.colors).length +
            Object.keys(tokens.spacing).length +
            Object.keys(tokens.fontSize).length +
            Object.keys(tokens.borderRadius).length +
            Object.keys(tokens.boxShadow).length;

        const expected = CANONICAL_SLOTS.filter(slot => !slot.path.startsWith("type.")).length;
        expect(bound).toBe(expected);
    });

    it("emits only var() references, never resolved values", () => {
        // The whole point: values live in tokens.css, so a theme swap needs no rebuild.
        for (const scale of Object.values(tokens)) {
            for (const value of Object.values(scale)) {
                expect(value).toMatch(/^var\(--wby-[a-z0-9-]+\)$/);
            }
        }
    });

    it("covers every colour slot the theme defines", () => {
        const colourSlots = CANONICAL_SLOTS.filter(slot => slot.path.startsWith("color.")).length;
        expect(Object.keys(tokens.colors)).toHaveLength(colourSlots);
    });
});

describe("webinyThemePreset", () => {
    it("wraps the scales under theme.extend for a Tailwind preset", () => {
        const preset = webinyThemePreset();

        expect(preset.theme.extend.colors["surface-page"]).toBe("var(--wby-color-surface-page)");
        expect(Object.keys(preset.theme.extend)).toEqual([
            "colors",
            "spacing",
            "fontSize",
            "borderRadius",
            "boxShadow"
        ]);
    });
});

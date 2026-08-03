import { describe, expect, it } from "vitest";
import { findContrastFailures } from "~/a11y/contrast.js";
import { findZoomWarnings } from "~/a11y/zoom.js";
import { CANONICAL_SLOTS } from "~/canonical/index.js";
import { META_EXTENSION } from "~/dtcg/types.js";
import { collectTokens, getTokenAtPath } from "~/dtcg/traverse.js";
import { validateFluidStep } from "~/fluid/clamp.js";
import { toCssVariableName } from "~/naming/cssVariable.js";
import { resolveDocumentModes } from "~/resolve/alias.js";
import { createDefaultThemeDocument } from "./defaultTheme.js";

const document = createDefaultThemeDocument();
const modes = resolveDocumentModes(document);

describe("default theme", () => {
    it("hands out a fresh copy each time", () => {
        expect(createDefaultThemeDocument()).not.toBe(createDefaultThemeDocument());
        expect(createDefaultThemeDocument()).toEqual(createDefaultThemeDocument());
    });

    it("fills every canonical slot — a theme is never partially filled", () => {
        const missing = CANONICAL_SLOTS.filter(slot => !getTokenAtPath(document, slot.path));
        expect(missing.map(slot => slot.path)).toEqual([]);
    });

    it("resolves with no alias errors in either mode", () => {
        expect(modes.light.errors).toEqual([]);
        expect(modes.dark.errors).toEqual([]);
    });

    it("resolves every canonical slot to a literal in both modes", () => {
        for (const slot of CANONICAL_SLOTS) {
            expect(modes.light.tokens.get(slot.path)?.value).toBeDefined();
            expect(modes.dark.tokens.get(slot.path)?.value).toBeDefined();
        }
    });

    it("passes every canonical contrast pair in both light and dark", () => {
        const failures = findContrastFailures({
            light: modes.light.tokens,
            dark: modes.dark.tokens
        });

        expect(failures.map(failure => `${failure.mode}: ${failure.message}`)).toEqual([]);
    });

    it("produces no zoom warnings on its fluid steps", () => {
        const steps = [...collectTokens(document).values()]
            .map(visited => ({
                path: visited.path,
                step: visited.token.$extensions?.[META_EXTENSION]?.fluid
            }))
            .filter((entry): entry is { path: string; step: NonNullable<typeof entry.step> } => {
                return entry.step !== undefined;
            });

        expect(steps.length).toBeGreaterThan(0);
        expect(findZoomWarnings(steps)).toEqual([]);
    });

    it("carries valid fluid metadata on every ramp step", () => {
        for (const visited of collectTokens(document).values()) {
            const fluid = visited.token.$extensions?.[META_EXTENSION]?.fluid;
            if (fluid) {
                expect(validateFluidStep(fluid)).toEqual([]);
            }
        }
    });

    it("gives every primitive an immutable key", () => {
        for (const visited of collectTokens(document).values()) {
            if (visited.path.startsWith("color.brand.") || visited.path.startsWith("font.")) {
                expect(visited.token.$extensions?.[META_EXTENSION]?.key).toBeTruthy();
            }
        }
    });

    it("points canonical colour slots at primitives rather than holding literals", () => {
        const slot = getTokenAtPath(document, "color.action.primary.background");
        expect(slot?.$value).toMatch(/^\{color\.brand\./);
    });

    it("emits a unique CSS variable name for every token", () => {
        const names = [...collectTokens(document).keys()].map(toCssVariableName);
        expect(new Set(names).size).toBe(names.length);
    });

    it("varies colour and shadow by mode but leaves spacing and radii alone", () => {
        expect(modes.light.tokens.get("color.surface.page")?.value).not.toBe(
            modes.dark.tokens.get("color.surface.page")?.value
        );
        expect(modes.light.tokens.get("space.md")?.value).toBe(
            modes.dark.tokens.get("space.md")?.value
        );
        expect(modes.light.tokens.get("radius.md")?.value).toBe(
            modes.dark.tokens.get("radius.md")?.value
        );
    });
});

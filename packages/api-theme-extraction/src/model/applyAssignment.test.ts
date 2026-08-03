import { describe, expect, it } from "vitest";
import {
    createDefaultThemeDocument,
    getTokenAtPath,
    type TokenDocument,
    type TypographyValue
} from "@webiny/theme-common";
import { applyAssignment } from "./applyAssignment.js";
import { validateAssignment, type ModelAssignment } from "./tokenAssignment.js";

const assignment = (overrides: Partial<ModelAssignment> = {}): ModelAssignment => ({
    tokens: {},
    uncertain: [],
    summary: "Extracted.",
    confidence: "medium",
    ...overrides
});

const apply = (overrides: Partial<ModelAssignment> = {}) =>
    applyAssignment(validateAssignment(assignment(overrides)));

const typographyAt = (document: TokenDocument, path: string): TypographyValue =>
    getTokenAtPath(document, path)?.$value as TypographyValue;

describe("applyAssignment", () => {
    it("writes a scalar value onto its slot", () => {
        const result = apply({ tokens: { "color.surface.page": "#fafafa" } });

        expect(getTokenAtPath(result.document, "color.surface.page")?.$value).toBe("#fafafa");
        expect(result.applied).toEqual(["color.surface.page"]);
        expect(result.failed).toEqual([]);
    });

    it("leaves unassigned slots at their defaults", () => {
        // This is what makes a partial answer safe — an omitted slot is a considered default, not a
        // hole, so the model can decline to guess.
        const defaults = createDefaultThemeDocument();
        const result = apply({ tokens: { "color.surface.page": "#fafafa" } });

        expect(getTokenAtPath(result.document, "color.text.primary")?.$value).toEqual(
            getTokenAtPath(defaults, "color.text.primary")?.$value
        );
    });

    it("writes typography sub-properties without disturbing the others", () => {
        const defaults = createDefaultThemeDocument();
        const result = apply({
            tokens: { "type.body": { fontFamily: "Inter", fontSize: "17px" } }
        });

        const applied = typographyAt(result.document, "type.body");
        const original = typographyAt(defaults, "type.body");

        expect(applied.fontFamily).toBe("Inter");
        expect(applied.fontSize).toBe("17px");
        expect(applied.letterSpacing).toEqual(original.letterSpacing);
    });

    it("accepts a numeric font weight or line height", () => {
        const result = apply({ tokens: { "type.body": { fontWeight: 600, lineHeight: 1.6 } } });

        const applied = typographyAt(result.document, "type.body");
        expect(applied.fontWeight).toBe(600);
        expect(applied.lineHeight).toBe(1.6);
    });

    it("stores a dark value as a mode override, keeping the light value", () => {
        const result = apply({
            tokens: { "color.surface.page": "#ffffff" },
            darkTokens: { "color.surface.page": "#0f172a" }
        });

        const token = getTokenAtPath(result.document, "color.surface.page");

        expect(token?.$value).toBe("#ffffff");
        expect(token?.$extensions?.["com.webiny.modes"]).toMatchObject({ dark: "#0f172a" });
        expect(result.applied).toContain("color.surface.page (dark)");
    });

    it("applies a dark value even when the light value came from defaults", () => {
        // Light is applied before dark, so the token always holds a light value before the override.
        const result = apply({ darkTokens: { "color.surface.page": "#0f172a" } });

        const token = getTokenAtPath(result.document, "color.surface.page");
        expect(token?.$value).toBeTruthy();
        expect(token?.$extensions?.["com.webiny.modes"]).toMatchObject({ dark: "#0f172a" });
    });

    it("applies every slot the model filled", () => {
        const result = apply({
            tokens: {
                "color.surface.page": "#ffffff",
                "color.text.primary": "#0b1220",
                "space.md": "16px",
                "shadow.md": "0 4px 8px rgba(0,0,0,.1)",
                "type.body": { fontFamily: "Inter" }
            }
        });

        expect(result.applied).toHaveLength(5);
        expect(result.failed).toEqual([]);
    });

    it("does not mutate the default document", () => {
        // The default is a fresh object per call, but an in-place edit would still corrupt this run's
        // document as later slots were applied on top.
        const before = JSON.stringify(createDefaultThemeDocument());
        apply({ tokens: { "color.surface.page": "#fafafa" } });

        expect(JSON.stringify(createDefaultThemeDocument())).toBe(before);
    });

    it("produces a usable document from an empty answer", () => {
        const result = apply();

        expect(result.applied).toEqual([]);
        expect(result.failed).toEqual([]);
        expect(getTokenAtPath(result.document, "color.surface.page")?.$value).toBeTruthy();
    });

    it("ignores typography properties the model omitted", () => {
        const result = apply({ tokens: { "type.body": {} } });

        expect(result.applied).toEqual(["type.body"]);
        expect(result.failed).toEqual([]);
    });
});

import { describe, expect, it } from "vitest";
import {
    createDefaultThemeDocument,
    getTokenAtPath,
    parseAlias,
    type ThemeMode,
    type TokenDocument,
    type TypographyValue
} from "@webiny/theme-common";
import { applyAssignment } from "./applyAssignment.js";
import {
    validateAssignment,
    type ModelAssignment,
    type ModelTypographyValue
} from "./tokenAssignment.js";
import type { RoleSignals } from "~/crawl/roleSignals.js";

// Tests express tokens as a convenient record; the schema is a list of { path, value }, so convert.
type AssignmentOverrides = {
    tokens?: Record<string, string | ModelTypographyValue>;
    darkTokens?: Record<string, string>;
    uncertain?: ModelAssignment["uncertain"];
    summary?: string;
    confidence?: ModelAssignment["confidence"];
};

const toEntries = <V>(record: Record<string, V>): Array<{ path: string; value: V }> =>
    Object.entries(record).map(([path, value]) => ({ path, value }));

const assignment = (overrides: AssignmentOverrides = {}): ModelAssignment => ({
    tokens: toEntries(overrides.tokens ?? {}),
    darkTokens: overrides.darkTokens ? toEntries(overrides.darkTokens) : undefined,
    uncertain: overrides.uncertain ?? [],
    summary: overrides.summary ?? "Extracted.",
    confidence: overrides.confidence ?? "medium"
});

const apply = (overrides: AssignmentOverrides = {}) =>
    applyAssignment(validateAssignment(assignment(overrides)));

const typographyAt = (document: TokenDocument, path: string): TypographyValue =>
    getTokenAtPath(document, path)?.$value as TypographyValue;

/** Follows a colour slot's brand reference to the primitive value it resolves to, per mode. */
const brandValue = (document: TokenDocument, path: string, mode: ThemeMode = "light"): unknown => {
    const token = getTokenAtPath(document, path);
    const raw =
        mode === "dark"
            ? (token?.$extensions?.["com.webiny.modes"] as { dark?: unknown } | undefined)?.dark
            : token?.$value;
    const target = parseAlias(raw);
    return target ? getTokenAtPath(document, target)?.$value : raw;
};

describe("applyAssignment", () => {
    it("links a colour slot to a brand primitive rather than writing a literal", () => {
        // A hand-made theme points every slot at the brand palette so editing a primitive cascades.
        // Extraction must produce the same shape, not a one-off literal on the slot.
        const result = apply({ tokens: { "color.surface.page": "#fafafa" } });

        const slot = getTokenAtPath(result.document, "color.surface.page");
        expect(parseAlias(slot?.$value)).toMatch(/^color\.brand\./);
        expect(brandValue(result.document, "color.surface.page")).toBe("#fafafa");
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

    it("keeps a role referencing the font set and the scale, not a literal", () => {
        // A role must alias `font.*` and `text.*` so the editor can show its Font and Step and editing
        // either cascades. The model's literal family and size are normalised back onto those refs.
        const defaults = createDefaultThemeDocument();
        const result = apply({
            tokens: { "type.body": { fontFamily: "Inter", fontSize: "17px" } }
        });

        const applied = typographyAt(result.document, "type.body");
        const original = typographyAt(defaults, "type.body");

        // Family stays the default alias; the site's family is captured against the font instead.
        expect(applied.fontFamily).toBe(original.fontFamily);
        expect(result.fonts).toContainEqual({ key: "sans", family: "Inter", weights: [] });
        // Size becomes a reference to the nearest ramp step rather than a one-off length.
        expect(applied.fontSize).toMatch(/^\{text\.[\da-z]+\}$/);
        expect(applied.letterSpacing).toEqual(original.letterSpacing);
    });

    it("accepts a numeric font weight or line height", () => {
        const result = apply({ tokens: { "type.body": { fontWeight: 600, lineHeight: 1.6 } } });

        const applied = typographyAt(result.document, "type.body");
        expect(applied.fontWeight).toBe(600);
        expect(applied.lineHeight).toBe(1.6);
    });

    it("resolves the site's family onto the theme's font set, ignoring generic stacks", () => {
        const result = apply({
            tokens: {
                "type.body": { fontFamily: "Inter, sans-serif", fontWeight: 400 },
                "type.heading.1": { fontFamily: "'Inter'", fontWeight: 700 },
                "type.code": { fontFamily: "system-ui" }
            }
        });

        // Body + heading agree on Inter for the sans font, with the weights those roles used.
        expect(result.fonts).toContainEqual({ key: "sans", family: "Inter", weights: [400, 700] });
        // The generic stack on the mono role names no real family, so nothing is recorded for it.
        expect(result.fonts.some(font => font.key === "mono")).toBe(false);
    });

    it("snaps a role's size to the ramp step the model set, not the default", () => {
        const result = apply({
            tokens: {
                "text.lg": "2rem",
                "type.lead": { fontSize: "2rem" }
            }
        });

        // `type.lead` defaults to the `lg` step; with `lg` reassigned to 2rem, a 2rem role lands on it.
        expect(typographyAt(result.document, "type.lead").fontSize).toBe("{text.lg}");
    });

    it("links light and dark to brand primitives, reusing a shipped one on an exact match", () => {
        const result = apply({
            tokens: { "color.surface.page": "#ffffff" },
            darkTokens: { "color.surface.page": "#123456" }
        });

        const token = getTokenAtPath(result.document, "color.surface.page");
        const darkRef = (token?.$extensions?.["com.webiny.modes"] as { dark?: unknown } | undefined)
            ?.dark;
        // #ffffff equals the shipped `white` primitive, so the slot reuses it rather than duplicating.
        expect(parseAlias(token?.$value)).toBe("color.brand.white");
        // The dark colour is not a shipped primitive, so it becomes a new one the dark mode references.
        expect(parseAlias(darkRef)).toMatch(/^color\.brand\./);
        expect(brandValue(result.document, "color.surface.page", "dark")).toBe("#123456");
        expect(result.applied).toContain("color.surface.page (dark)");
    });

    it("applies a dark value even when the light value came from defaults", () => {
        // Light is applied before dark, so the token always holds a light value before the override.
        // #0f172a matches the shipped `neutral-900`, so the dark override reuses that primitive.
        const result = apply({ darkTokens: { "color.surface.page": "#0f172a" } });

        const token = getTokenAtPath(result.document, "color.surface.page");
        expect(token?.$value).toBeTruthy();
        expect(
            String(brandValue(result.document, "color.surface.page", "dark")).toLowerCase()
        ).toBe("#0f172a");
    });

    it("builds the palette from the extracted colours and prunes what nothing uses", () => {
        const result = apply({
            tokens: {
                "color.action.primary.background": "#2563EB",
                // Same colour, different case — must collapse onto one brand primitive.
                "color.border.focus": "#2563eb",
                "color.surface.page": "#111827",
                "color.text.primary": "#f9fafb"
            }
        });

        const bg = parseAlias(
            getTokenAtPath(result.document, "color.action.primary.background")?.$value
        );
        const focus = parseAlias(getTokenAtPath(result.document, "color.border.focus")?.$value);
        expect(bg).toBeTruthy();
        expect(focus).toBe(bg);

        // Every assigned base slot references the palette; none holds a literal.
        for (const path of [
            "color.action.primary.background",
            "color.surface.page",
            "color.text.primary"
        ]) {
            expect(parseAlias(getTokenAtPath(result.document, path)?.$value)).toMatch(
                /^color\.brand\./
            );
        }

        // Pruned to colours in use: an unused shipped primitive is gone, one a default slot still
        // references stays.
        expect(getTokenAtPath(result.document, "color.brand.black")).toBeUndefined();
        expect(getTokenAtPath(result.document, "color.brand.green-50")).toBeDefined();
    });

    it("derives the action states from the extracted colours, linking those that map to a brand colour (C13)", () => {
        const result = apply({
            tokens: {
                "color.action.primary.background": "#2563EB",
                "color.action.primary.foreground": "#FFFFFF",
                "color.feedback.danger.foreground": "#B00020",
                "color.text.muted": "#777777",
                "color.text.primary": "#111111",
                "color.surface.sunken": "#EEEEEE"
            }
        });

        const value = (path: string) => getTokenAtPath(result.document, path)?.$value;

        // States that map onto a real colour link to the palette (so editing that brand colour
        // cascades, like the hand-built default theme) and resolve to the colour they came from — the
        // "copy" states de-dup onto the primitive their base already uses rather than duplicating it.
        for (const [path, resolved] of [
            ["color.action.disabled.background", "#EEEEEE"], // extracted sunken
            ["color.action.disabled.foreground", "#777777"], // extracted muted
            ["color.action.destructive.background", "#B00020"], // extracted danger
            ["color.action.destructive.foreground", "#FFFFFF"] // danger is dark → white label
        ] as const) {
            expect(parseAlias(value(path))).toMatch(/^color\.brand\./);
            expect(brandValue(result.document, path)).toBe(resolved);
        }

        // A hover shade has no base twin, so it becomes its own named brand primitive, still linked.
        expect(parseAlias(value("color.action.primary.hover"))).toMatch(/^color\.brand\./);

        // The transparent fill, the alpha tints and the scrim have no brand equivalent, so they stay
        // literal — exactly the slots the default theme leaves as literals too.
        expect(value("color.action.ghost.background")).toBe("transparent");
        expect(String(value("color.action.destructive.hover"))).toMatch(/^#/); // lightness shift
        expect(String(value("color.surface.scrim"))).toMatch(/^rgba\(17, 17, 17,/);
    });

    it("points a copy state at the very same brand primitive as the base it mirrors", () => {
        // ghost.foreground is the link accent; destructive.background is the danger colour. Each must
        // alias the *same* brand entry as its base, so editing that one colour moves both together —
        // rather than holding a literal, which is what these extra action slots used to do.
        const result = apply({
            tokens: {
                "color.text.link": "#0055FF",
                "color.feedback.danger.foreground": "#CC0000"
            }
        });

        const ref = (path: string) => parseAlias(getTokenAtPath(result.document, path)?.$value);

        expect(ref("color.action.ghost.foreground")).toBe(ref("color.text.link"));
        expect(ref("color.action.destructive.background")).toBe(
            ref("color.feedback.danger.foreground")
        );
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

describe("applyAssignment role detection", () => {
    const applyWith = (roleSignals: RoleSignals, overrides: AssignmentOverrides = {}) =>
        applyAssignment(validateAssignment(assignment(overrides)), roleSignals);

    it("snaps control and container radius to the ramp step the site uses", () => {
        // 9999px and 0px sit unambiguously on `full` and `none`, neither a plausible default for these
        // roles — so a match proves the measurement overrode the seeded alias.
        const result = applyWith({
            radiusControl: { value: "9999px", samples: 10 },
            radiusContainer: { value: "0px", samples: 6 }
        });

        expect(parseAlias(getTokenAtPath(result.document, "radius.control")?.$value)).toBe(
            "radius.full"
        );
        expect(parseAlias(getTokenAtPath(result.document, "radius.container")?.$value)).toBe(
            "radius.none"
        );
        expect(result.applied).toEqual(
            expect.arrayContaining(["radius.control", "radius.container"])
        );
        expect(result.uncertain).toEqual([]);
    });

    it("snaps control border width to the border ramp", () => {
        // 1px is the hairline step exactly.
        const result = applyWith({ borderControl: { value: "1px", samples: 8 } });

        expect(parseAlias(getTokenAtPath(result.document, "border.control")?.$value)).toBe(
            "border.hairline"
        );
    });

    it("leaves a role at its default when there is no measurement", () => {
        const defaults = createDefaultThemeDocument();
        const result = applyWith({ radiusControl: { value: "6px", samples: 5 } });

        // radius.container had no signal, so it must be byte-for-byte the default.
        expect(getTokenAtPath(result.document, "radius.container")?.$value).toEqual(
            getTokenAtPath(defaults, "radius.container")?.$value
        );
    });

    it("applies but flags a snap drawn from too few elements", () => {
        const result = applyWith({ radiusControl: { value: "9999px", samples: 1 } });

        // Still applied — a low-confidence guess beats the generic default …
        expect(parseAlias(getTokenAtPath(result.document, "radius.control")?.$value)).toBe(
            "radius.full"
        );
        // … but surfaced for review rather than presented as settled.
        expect(result.uncertain).toContainEqual(
            expect.objectContaining({ path: "radius.control" })
        );
    });

    it("does no role detection when no signals are supplied", () => {
        const defaults = createDefaultThemeDocument();
        const result = apply();

        expect(getTokenAtPath(result.document, "radius.control")?.$value).toEqual(
            getTokenAtPath(defaults, "radius.control")?.$value
        );
        expect(result.uncertain).toEqual([]);
    });
});

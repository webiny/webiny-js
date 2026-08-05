import { describe, expect, it } from "vitest";
import { createDefaultThemeDocument } from "~/defaults/defaultTheme.js";
import { META_EXTENSION, type TokenGroup } from "~/dtcg/types.js";
import { createDefaultPolicy, type ThemePolicy } from "~/policy/types.js";
import { createResolvedSnapshot } from "~/snapshot.js";
import { createDefaultSettings } from "~/theme/settings.js";
import { generateCssArtifact, THEME_MODE_ATTRIBUTE } from "./css.js";
import { generateJsonArtifact } from "./json.js";
import { formatFontFamily, formatShadow } from "./values.js";

const settings = createDefaultSettings();
const now = new Date("2026-08-01T10:00:00.000Z");

const snapshotOf = (
    policy: ThemePolicy = createDefaultPolicy(),
    document = createDefaultThemeDocument()
) => createResolvedSnapshot({ document, policy, settings, now });

describe("value formatting", () => {
    it("quotes multi-word font families and leaves stacks alone", () => {
        expect(formatFontFamily("Inter")).toBe("Inter");
        expect(formatFontFamily("IBM Plex Mono")).toBe('"IBM Plex Mono"');
        expect(formatFontFamily(["Inter", "IBM Plex Mono"])).toBe('Inter, "IBM Plex Mono"');
        expect(formatFontFamily("Inter, sans-serif")).toBe("Inter, sans-serif");
    });

    it("serialises a shadow layer in CSS order", () => {
        expect(
            formatShadow({
                color: "rgba(0, 0, 0, 0.1)",
                offsetX: "0rem",
                offsetY: "0.25rem",
                blur: "0.5rem",
                spread: "0rem"
            })
        ).toBe("0rem 0.25rem 0.5rem 0rem rgba(0, 0, 0, 0.1)");
    });

    it("marks an inset shadow and joins multiple layers", () => {
        const layer = {
            color: "#000",
            offsetX: "0rem",
            offsetY: "0rem",
            blur: "0rem",
            spread: "0rem"
        };

        expect(formatShadow({ ...layer, inset: true })).toMatch(/^inset /);
        expect(formatShadow([layer, layer]).split(", ").length).toBeGreaterThan(1);
    });
});

describe("generateCssArtifact", () => {
    const css = generateCssArtifact(snapshotOf(), { themeId: "abc123", version: 3 });

    it("names the theme and the snapshot it came from", () => {
        expect(css).toContain("Webiny theme abc123 v3");
        expect(css).toContain("2026-08-01T10:00:00.000Z");
    });

    it("emits light values under :root", () => {
        expect(css).toContain(":root {");
        expect(css).toContain("--wby-color-surface-page: #F8FAFC;");
    });

    it("folds in the rich-text structural rules so one <link> themes WB rich text too", () => {
        // Targets WB's baked class names, reading the variables defined above — so the same artifact
        // themes every saved page's rich text with no extra request and no content migration.
        expect(css).toContain(".wb-lx-h1 {");
        expect(css).toContain("font-size: var(--wby-type-heading-1-size);");
        expect(css).toContain(".wb-lx-paragraph {");
    });

    it("emits dark values under the mode attribute", () => {
        expect(css).toContain(`[${THEME_MODE_ATTRIBUTE}="dark"] {`);
        expect(css).toContain("--wby-color-surface-page: #0F172A;");
    });

    it("follows the system preference unless an explicit light attribute is set", () => {
        expect(css).toContain("@media (prefers-color-scheme: dark)");
        expect(css).toContain(`:root:not([${THEME_MODE_ATTRIBUTE}="light"])`);
    });

    it("does not re-declare mode-invariant tokens in the dark block", () => {
        const darkBlock = css.split(`[${THEME_MODE_ATTRIBUTE}="dark"] {`)[1].split("}")[0];

        expect(darkBlock).not.toContain("--wby-space-md");
        expect(darkBlock).not.toContain("--wby-radius-md");
        expect(darkBlock).toContain("--wby-color-surface-page");
    });

    it("flattens a composite typography token to one variable per sub-property", () => {
        expect(css).toContain("--wby-type-heading-1-family:");
        expect(css).toContain("--wby-type-heading-1-size:");
        expect(css).toContain("--wby-type-heading-1-weight:");
        expect(css).toContain("--wby-type-heading-1-line-height:");
        expect(css).toContain("--wby-type-heading-1-letter-spacing:");
    });

    it("emits a plain fallback immediately before every clamp()", () => {
        const lines = css.split("\n").map(line => line.trim());

        const clampLines = lines
            .map((line, index) => ({ line, index }))
            .filter(entry => entry.line.includes("clamp("));

        expect(clampLines.length).toBeGreaterThan(0);

        for (const { line, index } of clampLines) {
            const name = line.split(":")[0];
            const previous = lines[index - 1];

            expect(previous.startsWith(`${name}:`)).toBe(true);
            expect(previous).not.toContain("clamp(");
        }
    });

    it("keeps a rem component in every clamp middle term", () => {
        for (const line of css.split("\n").filter(candidate => candidate.includes("clamp("))) {
            const middle = line.slice(line.indexOf("clamp(") + 6).split(", ")[1];
            expect(middle).toContain("rem");
            expect(middle).toContain("vw");
        }
    });

    it("emits fixed ramp steps as a plain length", () => {
        expect(css).toContain("--wby-text-md: 1rem;");
        expect(css).not.toMatch(/--wby-text-md: clamp/);
    });

    it("serialises shadows as CSS shadow syntax", () => {
        expect(css).toMatch(/--wby-shadow-md: 0rem [\d.]+rem/);
    });

    it("quotes a multi-word font family", () => {
        expect(css).toContain('--wby-type-code-family: "IBM Plex Mono";');
    });

    it("omits the media query when policy forces light", () => {
        const forced = generateCssArtifact(
            snapshotOf({ ...createDefaultPolicy(), defaultMode: "light" })
        );

        expect(forced).not.toContain("prefers-color-scheme");
        expect(forced).toContain(`[${THEME_MODE_ATTRIBUTE}="dark"] {`);
    });

    it("applies dark unconditionally when policy forces dark", () => {
        const forced = generateCssArtifact(
            snapshotOf({ ...createDefaultPolicy(), defaultMode: "dark" })
        );

        expect(forced).not.toContain("prefers-color-scheme");
        expect(forced).toContain(`:root:not([${THEME_MODE_ATTRIBUTE}="light"]) {`);
    });

    it("still emits a deprecated token, so existing content keeps rendering", () => {
        const document = createDefaultThemeDocument();
        const brand = (document.color as TokenGroup).brand as TokenGroup;
        brand["neutral-50"] = {
            $value: "#F8FAFC",
            $extensions: { [META_EXTENSION]: { key: "neutral-50", deprecated: true } }
        };

        const css = generateCssArtifact(snapshotOf(createDefaultPolicy(), document));
        expect(css).toContain("--wby-color-brand-neutral-50: #F8FAFC;");
    });
});

describe("generateJsonArtifact", () => {
    const json = generateJsonArtifact(snapshotOf(), { themeId: "abc123", version: 3 });

    it("identifies the theme version it was generated from", () => {
        expect(json).toMatchObject({
            schemaVersion: 1,
            themeId: "abc123",
            version: 3,
            resolvedAt: "2026-08-01T10:00:00.000Z",
            cssVariablePrefix: "--wby-"
        });
    });

    it("carries both mode values on every token", () => {
        const page = json.tokens.find(token => token.path === "color.surface.page");

        expect(page?.values).toEqual({ light: "#F8FAFC", dark: "#0F172A" });
    });

    it("repeats the light value for a mode-invariant token", () => {
        const space = json.tokens.find(token => token.path === "space.md");

        expect(space?.values.light).toBe(space?.values.dark);
    });

    it("marks canonical slots so consumers know what is core-owned", () => {
        expect(json.tokens.find(token => token.path === "color.surface.page")?.canonical).toBe(
            true
        );
        expect(json.tokens.find(token => token.path === "color.brand.neutral-50")?.canonical).toBe(
            false
        );
    });

    it("lists every CSS variable a token contributes", () => {
        expect(json.tokens.find(token => token.path === "space.md")?.cssVariables).toEqual([
            "--wby-space-md"
        ]);

        expect(
            json.tokens.find(token => token.path === "type.heading.1")?.cssVariables
        ).toHaveLength(5);
    });

    it("describes the group structure", () => {
        const root = json.groups.find(group => group.path === "");
        expect(root?.groups).toContain("color");

        const surface = json.groups.find(group => group.path === "color.surface");
        expect(surface?.tokens).toContain("color.surface.page");
    });

    it("carries display names for primitives", () => {
        const primitive = json.tokens.find(token => token.path === "color.brand.neutral-50");
        expect(primitive?.displayName).toBe("neutral-50");
    });

    it("carries fluid state on ramp steps", () => {
        expect(json.tokens.find(token => token.path === "text.3xl")?.fluid?.enabled).toBe(true);
        expect(json.tokens.find(token => token.path === "text.md")?.fluid?.enabled).toBe(false);
    });

    it("carries the policy section and the fonts the head needs", () => {
        expect(json.policy).toEqual(createDefaultPolicy());
        expect(json.fonts.map(font => font.family)).toEqual(["Inter", "IBM Plex Mono"]);
        expect(json.viewport).toEqual(settings.viewport);
    });
});

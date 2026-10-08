import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateManifestArtifact } from "@webiny/theme-common";
import { systemPromptOverride, themeVocabulary } from "./themeVocabulary.js";

// thevibe's extracted theme as published.
const resolved = JSON.parse(
    readFileSync(new URL("./__fixtures__/thevibe-theme.resolved.json", import.meta.url), "utf8")
);
const manifest = generateManifestArtifact(resolved, { themeId: "thevibe", version: 1 });

describe("themeVocabulary", () => {
    it("is the manifest's variables, with the site's values", () => {
        const entries = themeVocabulary(manifest);
        const gap = entries.find(entry => entry.variable === "--wby-space-gap");
        expect(gap?.value).toBe("20px");
        expect(gap?.description).toMatch(/gap between items/i);
        expect(entries.some(entry => entry.variable === "--wby-space-md")).toBe(false);
    });
});

describe("systemPromptOverride", () => {
    const override = systemPromptOverride(manifest);

    it("lists only what the manifest defines", () => {
        expect(override.tokenCatalog).toContain("`var(--wby-space-gap, 20px)`");
        expect(override.tokenCatalog).not.toContain("--wby-space-md");
        expect(override.tokenCatalog).not.toContain("--wby-shadow-none");
    });

    it("rewrites the examples' primitive spacing into the theme's nearest slot", () => {
        // thevibe: gap 20px, container padding 25px, control padding 10px/8px, section 81px.
        expect(override.rewriteExampleVariable("--wby-space-md", "16px")).toBe(
            "var(--wby-space-gap, 20px)"
        );
        expect(override.rewriteExampleVariable("--wby-space-3xl", "80px")).toBe(
            "var(--wby-space-section, 5.0625rem)"
        );
        expect(override.rewriteExampleVariable("--wby-space-gap", "12px")).toBeNull();
        expect(override.rewriteExampleVariable("--wby-shadow-none", "none")).toBe("none");
    });
});

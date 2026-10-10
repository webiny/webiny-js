import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { ThemeManifest } from "@webiny/theme-common";
import type { ResolvedColour } from "~/domain/artifacts.js";
import { crossesFamily } from "../generate/colourFamilies.js";
import { rematchColours, themeColourRoles } from "./resolvedColours.js";

/*
 * Every case is from a stored run (colour-matcher-replay-result.md). The fixture holds the colour slots
 * of four themes the jobs pin, as `generateManifestArtifact` builds them from the published snapshots.
 */
const fixture = (name: string) =>
    JSON.parse(readFileSync(new URL(`./__fixtures__/${name}.json`, import.meta.url), "utf8"));
const themes = fixture("pinnedThemeColours") as Record<string, ThemeManifest>;

const match = (theme: string, role: ResolvedColour["role"], hex: string) =>
    rematchColours([{ role, hex, area: 1, token: null }], themes[theme])[0].token;

describe("the colour matcher", () => {
    it("reads Take 3's grey, written with an alpha byte, as the surface it is", () => {
        // `color.surface.raised` is `#f7f7f9f2` (0.95). Unread, the header went to pale blue.
        expect(match("take3", "background", "#f7f7f9")?.path).toBe("color.surface.raised");
        // The footer's grey is 9.9 away: matched, and the fit will call it near.
        expect(match("take3", "background", "#f2f2f2")?.path).toBe("color.surface.raised");
    });

    it("does not read a translucent overlay as the solid colour of its RGB", () => {
        // The Vibe's `surface.overlay` is `#000000b3` (0.70): an overlay, not the site's black.
        const paths = themeColourRoles(themes.vibe).map(colour => colour.path);
        expect(paths).not.toContain("color.surface.overlay");
        // Nor any theme's scrim (0.5).
        for (const theme of Object.values(themes)) {
            expect(themeColourRoles(theme).map(c => c.path)).not.toContain("color.surface.scrim");
        }
    });

    it("never offers a status colour, for any role, in any theme", () => {
        for (const theme of Object.values(themes)) {
            const statuses = themeColourRoles(theme).filter(c =>
                c.path.startsWith("color.feedback.")
            );
            expect(statuses).toEqual([]);
        }
    });

    it("sends the greys that went to status colours somewhere else", () => {
        // Each was a status colour before: info, success and danger backgrounds.
        expect(match("take3", "background", "#f7f7f9")?.path).not.toMatch(/feedback/);
        expect(match("freehill", "background", "#f2f0eb")?.path).toBe("color.surface.sunken");
        expect(match("tulane", "background", "#efefef")?.path).toBe("color.border.subtle");
    });
});

describe("refused crossings", () => {
    it("refuses a background drawn in a border colour, which the prompt then writes as the hex", () => {
        // 2424 Tulane's #efefef and Freehill's #dddacd: exact, and repainted by the subtle border.
        expect(crossesFamily("background", match("tulane", "background", "#efefef")!.path)).toBe(
            true
        );
        expect(crossesFamily("background", match("freehill", "background", "#dddacd")!.path)).toBe(
            true
        );
    });

    it("refuses a status colour for every role, however it arrives", () => {
        for (const role of ["background", "text", "border"] as const) {
            expect(crossesFamily(role, "color.feedback.info.background")).toBe(true);
            expect(crossesFamily(role, "color.feedback.danger.foreground")).toBe(true);
        }
    });
});

describe("matching again against the pinned theme", () => {
    it("moves Take 3's five status bindings and nothing else", () => {
        const stored = fixture("take3StoredColours") as { colours: ResolvedColour[] }[];
        const before = stored.flatMap(cluster => cluster.colours);
        const after = rematchColours(before, themes.take3);

        const moved = before
            .map((colour, index) => ({ colour, now: after[index].token?.path ?? null }))
            .filter(({ colour, now }) => (colour.token?.path ?? null) !== now);

        expect(before).toHaveLength(57);
        expect(moved.map(({ colour }) => colour.token?.path)).toEqual(
            Array(5).fill(expect.stringMatching(/^color\.feedback\./))
        );
        expect(moved.every(({ now }) => now === "color.surface.raised")).toBe(true);
    });
});

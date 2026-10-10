import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { createDefaultThemeDocument } from "@webiny/theme-common";
import { themeSnapshot } from "./themeSnapshot.js";
import type { ThemeDocumentsDto } from "~/shared/types.js";

const westland = JSON.parse(
    readFileSync(new URL("./__fixtures__/westland-theme.json", import.meta.url), "utf8")
) as ThemeDocumentsDto;

/*
 * The fixture is the theme extraction published for the 71 Westland rehearsal job (2026-10-09), as the
 * Theme API returned it. The extraction's own summary of the site: "stark black-and-white editorial
 * design with a single olive-green accent (#627a48) reserved for inline text links".
 */
describe("themeSnapshot", () => {
    it("shows the colours extraction set, not the default ramps it sits on", () => {
        const snapshot = themeSnapshot(westland);

        expect(snapshot.colours.map(colour => colour.value.toLowerCase())).toEqual([
            "#ffffff",
            "#000000",
            "#747371",
            "#cacaca",
            "#627a48"
        ]);
        // The theme also holds a blue the site never uses: a brand token no slot points at.
        expect(snapshot.colours.map(colour => colour.value)).not.toContain("#3B73ED");
    });

    it("reports the extracted type sizes and that the font was not extracted", () => {
        const snapshot = themeSnapshot(westland);

        expect(snapshot.sizes).toEqual([
            { label: "H1", size: "43px" },
            { label: "H2", size: "24px" },
            { label: "H3", size: "18px" },
            { label: "Body", size: "16px" }
        ]);
        expect(snapshot.font).toEqual({ family: "Inter", extracted: false });
    });

    it("shows nothing for the default theme itself", () => {
        const defaults = createDefaultThemeDocument();
        const snapshot = themeSnapshot({ id: "d", tokens: defaults, resolved: westland.resolved });

        expect(snapshot.colours).toEqual([]);
        expect(snapshot.sizes).toEqual([]);
        expect(snapshot.font?.extracted).toBe(false);
    });
});

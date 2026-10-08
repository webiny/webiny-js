import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { ThemeManifest } from "@webiny/theme-common";
import type { CapturedNode } from "~/domain/artifacts.js";
import { findNodeByBox } from "../cluster/sectionNode.js";
import { sectionSpacing } from "./sectionSpacing.js";

// Park City's Property Description, its real page tree pruned to the section and its ancestors.
const root = JSON.parse(
    readFileSync(
        new URL("../cluster/__fixtures__/parkcity-property-description.tree.json", import.meta.url),
        "utf8"
    )
) as CapturedNode;
const section = findNodeByBox(root, { x: 0, y: 770, width: 1440, height: 640 })!;

const manifest = (slots: Array<[string, string, string]>): ThemeManifest =>
    ({
        slots: slots.map(([path, variable, value]) => ({
            path,
            cssVariables: [variable],
            values: { light: value, dark: value }
        }))
    }) as unknown as ThemeManifest;

describe("sectionSpacing", () => {
    it("reads each kind's most common value from the captured styles", () => {
        expect(sectionSpacing(section, null).map(entry => [entry.kind, entry.px])).toEqual([
            ["section", 60],
            ["container", 30],
            ["gap", 16]
        ]);
    });

    it("gives a kind the theme's variable only when the theme's value is the section's", () => {
        // Park City's extracted theme: gap 20px, container padding 25px — neither is this section's.
        const park = manifest([
            ["space.gap", "--wby-space-gap", "20px"],
            ["space.container.padding", "--wby-space-container-padding", "25px"]
        ]);
        expect(sectionSpacing(section, park).every(entry => entry.token === null)).toBe(true);

        const matching = manifest([["space.gap", "--wby-space-gap", "16px"]]);
        expect(
            sectionSpacing(section, matching).find(entry => entry.kind === "gap")?.token
        ).toEqual({
            path: "space.gap",
            cssVariable: "--wby-space-gap",
            px: 16
        });
    });
});

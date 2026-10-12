import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CapturedNode } from "@webiny/api-component-extraction/domain/artifacts.js";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { headingLevelInput } from "./headingLevelInput.js";

/*
 * Take 3's Property Highlights Links, both copies: on the home page its section holds three h2s
 * ("Floor Plans", "Amenities", "Neighborhood"); on the residents page, one h1.
 */
const copies = (
    JSON.parse(
        readFileSync(new URL("./__fixtures__/take3-highlights-copies.json", import.meta.url), "utf8")
    ) as { copies: Array<{ url: string; node: CapturedNode }> }
).copies;
const home = copies[0]!;
const residents = copies[1]!;

const manifest = (inputs: string[]) =>
    ({ name: "Take3/Property Highlights Links", inputs: inputs.map(name => ({ name })) }) as never as ComponentManifest;

describe("headingLevelInput", () => {
    it("sets each page's own level, so one component is the h2 on one page and the h1 on another", () => {
        const withLevel = manifest(["items", "headingLevel"]);
        expect(headingLevelInput({ node: home.node, manifest: withLevel })).toEqual({
            headingLevel: "h2"
        });
        expect(headingLevelInput({ node: residents.node, manifest: withLevel })).toEqual({
            headingLevel: "h1"
        });
    });

    it("sets nothing for a component that declares no heading-level input", () => {
        expect(headingLevelInput({ node: home.node, manifest: manifest(["items"]) })).toEqual({});
    });

    it("sets nothing where this page's section marks up no heading, so the default stands", () => {
        const empty = { tag: "section", box: home.node.box, styles: {}, children: [] } as CapturedNode;
        expect(headingLevelInput({ node: empty, manifest: manifest(["headingLevel"]) })).toEqual({});
    });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CapturedNode } from "@webiny/api-component-extraction/domain/artifacts.js";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { deriveCompositeInputs } from "./deriveCompositeInputs.js";

/* Take 3's Property Highlights Links, both copies (home page and residents page), as captured. */
const copies = (
    JSON.parse(
        readFileSync(new URL("./__fixtures__/take3-highlights-copies.json", import.meta.url), "utf8")
    ) as { copies: Array<{ url: string; node: CapturedNode }> }
).copies;

const manifest = {
    name: "Take3/Feature Picture",
    inputs: [
        { name: "image", type: "file" },
        { name: "imageAlt", type: "text" }
    ]
} as never as ComponentManifest;

const inputsFor = (index: number) =>
    deriveCompositeInputs({ node: copies[index]!.node, manifest, sourceUrl: copies[index]!.url });

describe("a top-level image's alt", () => {
    it("is this page's alt, beside this page's picture", () => {
        expect(inputsFor(0).imageAlt).toBe(
            "Bedroomof an apartment home at Park City Place in Bridgeport, Connecticut"
        );
        expect(inputsFor(1).imageAlt).toBe(
            "Resident with his kids in living room at Park City Place in Bridgeport, Connecticut"
        );
    });

    it("is never the picture's URL, though `imageAlt` matches the image test by name", () => {
        for (const index of [0, 1]) {
            const alt = String(inputsFor(index).imageAlt);
            expect(alt).not.toMatch(/^https?:/);
            expect(alt).not.toContain("GettyImages");
        }
    });
});

describe("a top-level image's drawn size", () => {
    it("is the size this page draws the picture at: 430x430 on the home page, 720x450 on the residents page", () => {
        expect(inputsFor(0).image).toEqual({
            url: expect.stringContaining("GettyImages-1227235023"),
            width: 430,
            height: 430
        });
        expect(inputsFor(1).image).toEqual({
            url: expect.stringContaining("GettyImages-1390905979"),
            width: 720,
            height: 450
        });
    });

    it("leaves a component that reads the input as a plain string with a plain string", () => {
        const value = deriveCompositeInputs({
            node: copies[0]!.node,
            manifest,
            sourceUrl: copies[0]!.url,
            fileShapes: new Map([["image", "string"]])
        }).image;
        expect(typeof value).toBe("string");
        expect(value).toContain("GettyImages-1227235023");
    });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { representativeValues, type CapturedNode, type ComponentProp } from "~/domain/artifacts.js";
import { bindObservedValues } from "./bindObservedValues.js";

/*
 * Park City Place's Property Description as captured: the home page's copy (the representative — a
 * three-photo carousel beside three paragraphs) and the Neighborhood page's copy. The component shipped
 * the paragraphs as image alts and another page's photographs as its defaults.
 */
const fixture = (name: string): CapturedNode =>
    JSON.parse(readFileSync(new URL(`./__fixtures__/${name}.json`, import.meta.url), "utf8"));

const imagesProp = (): ComponentProp =>
    ({
        name: "images",
        type: "Image",
        array: true,
        optional: false,
        observedValues: [],
        fields: [
            { name: "src", type: "image", array: false, optional: false, observedValues: [] },
            { name: "alt", type: "string", array: false, optional: true, observedValues: [] }
        ]
    }) as unknown as ComponentProp;

describe("bindObservedValues on Park City's Property Description", () => {
    const props = [imagesProp()];
    bindObservedValues(
        [
            fixture("parkcity-property-description-home"),
            fixture("parkcity-property-description-bridgeport")
        ],
        props
    );
    const own = representativeValues(props[0].observedStructured);

    it("binds the representative's photo list to its photographs, not its paragraphs", () => {
        const sources = own.map(value =>
            value.kind === "item" &&
            typeof value.fields.src === "object" &&
            "src" in value.fields.src
                ? value.fields.src.src
                : null
        );
        expect(sources.every(Boolean)).toBe(true);
        expect(sources.join(" ")).toContain("GettyImages-172432728");
        expect(props[0].observedValues.join(" ")).not.toContain("formerly the Holiday Inn");
    });

    it("takes each item's alt from its photograph", () => {
        const alts = own.map(value => (value.kind === "item" ? value.fields.alt : null));
        expect(alts).toContain(
            "Breakfast bar in a kitchen at Park City Place in Bridgeport, Connecticut"
        );
    });

    it("keeps the other copy's photographs in the union, marked as not the representative's", () => {
        const others = (props[0].observedStructured ?? []).filter(value => value.member === 1);
        expect(others.length).toBeGreaterThan(0);
        expect(own.some(value => JSON.stringify(value).includes("GettyImages-1375934212"))).toBe(
            false
        );
    });
});

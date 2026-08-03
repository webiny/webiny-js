import { describe, expect, it } from "vitest";
import { tallyColors } from "./inventory.js";
import type { SampledElement } from "./samplePage.js";
import { mergeObservations, toObservations } from "./toObservations.js";

const element = (overrides: Partial<SampledElement> = {}): SampledElement => ({
    tag: "div",
    area: 100,
    glyphs: 0,
    interactive: false,
    backgroundColor: "none",
    borderColor: "none",
    borderWidth: "0px",
    borderRadius: "none",
    boxShadow: "none",
    color: "none",
    fontFamily: "none",
    fontSize: "none",
    fontWeight: "none",
    lineHeight: "normal",
    letterSpacing: "normal",
    paddingTop: "0px",
    paddingLeft: "0px",
    marginTop: "0px",
    gap: "normal",
    ...overrides
});

describe("toObservations", () => {
    it("weights a background by area and text by glyphs", () => {
        const result = toObservations([
            element({ backgroundColor: "#eee", area: 5000, color: "#000", glyphs: 12 })
        ]);

        const background = result.colors.find(o => o.property === "background")!;
        const text = result.colors.find(o => o.property === "text")!;

        expect(background.area).toBe(5000);
        expect(text.glyphs).toBe(12);
    });

    it("ignores a border colour when nothing is actually drawn", () => {
        const withoutBorder = toObservations([
            element({ borderColor: "#ccc", borderWidth: "0px" })
        ]);
        const withBorder = toObservations([element({ borderColor: "#ccc", borderWidth: "1px" })]);

        expect(withoutBorder.colors).toHaveLength(0);
        expect(withBorder.colors).toHaveLength(1);
    });

    it("ignores text colour on an element with no text of its own", () => {
        const result = toObservations([element({ color: "#000", glyphs: 0 })]);
        expect(result.colors).toHaveLength(0);
    });

    it("discards values that carry no design intent", () => {
        const result = toObservations([
            element({
                backgroundColor: "none",
                boxShadow: "none",
                borderRadius: "none",
                paddingTop: "0px",
                gap: "normal"
            })
        ]);

        expect(result.colors).toEqual([]);
        expect(result.shadows).toEqual([]);
        expect(result.radii).toEqual([]);
        expect(result.spacing).toEqual([]);
    });

    it("collects every spacing property from one element", () => {
        const result = toObservations([
            element({ paddingTop: "16px", paddingLeft: "24px", marginTop: "8px", gap: "12px" })
        ]);

        expect(result.spacing.map(o => o.value).sort()).toEqual(["12px", "16px", "24px", "8px"]);
    });

    it("feeds straight into the tally, keeping the brief's weighting end to end", () => {
        // 200 small bordered icons versus one large hero background.
        const icons = Array.from({ length: 200 }, () =>
            element({ borderColor: "#111", borderWidth: "1px", area: 16 })
        );
        const hero = element({ backgroundColor: "#eeeeee", area: 900_000 });

        const observations = toObservations([...icons, hero]);
        const tallied = tallyColors(observations.colors);

        expect(tallied[0].value).toBe("#eeeeee");
    });
});

describe("mergeObservations", () => {
    it("combines pages into one inventory", () => {
        const a = toObservations([element({ backgroundColor: "#fff" })]);
        const b = toObservations([element({ backgroundColor: "#000" })]);

        expect(mergeObservations([a, b]).colors).toHaveLength(2);
    });

    it("handles an empty crawl without failing", () => {
        expect(mergeObservations([]).colors).toEqual([]);
    });
});

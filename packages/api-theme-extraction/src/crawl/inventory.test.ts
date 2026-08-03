import { describe, expect, it } from "vitest";
import {
    DEFAULT_QUANTISE_DISTANCE,
    normaliseColor,
    normaliseLength,
    quantiseColors,
    tally,
    tallyColors,
    tallyLengths,
    topN,
    weightOf,
    type StyleObservation
} from "./inventory.js";

const observe = (
    value: string,
    property: StyleObservation["property"],
    area = 0,
    glyphs = 0
): StyleObservation => ({ value, property, area, glyphs });

describe("weightOf", () => {
    it("weights background and border by rendered area", () => {
        expect(weightOf(observe("#fff", "background", 5000, 3))).toBe(5000);
        expect(weightOf(observe("#fff", "border", 200, 3))).toBe(200);
    });

    it("weights text by glyph count", () => {
        expect(weightOf(observe("#000", "text", 5000, 42))).toBe(42);
    });

    it("treats negative measurements as zero", () => {
        expect(weightOf(observe("#000", "background", -10, 0))).toBe(0);
    });
});

describe("normaliseColor", () => {
    it("collapses equivalent spellings onto one value", () => {
        expect(normaliseColor("#FFF")).toBe("#ffffff");
        expect(normaliseColor("#ffffff")).toBe("#ffffff");
        expect(normaliseColor("rgb(255, 255, 255)")).toBe("#ffffff");
    });

    it("keeps alpha, because a scrim is not the same token as the solid colour", () => {
        expect(normaliseColor("rgba(0, 0, 0, 0.5)")).toBe("#00000080");
    });

    it("discards fully transparent values, which say nothing about the palette", () => {
        expect(normaliseColor("transparent")).toBeNull();
        expect(normaliseColor("rgba(0, 0, 0, 0)")).toBeNull();
    });

    it("returns null for anything it cannot parse", () => {
        expect(normaliseColor("hsl(210, 40%, 50%)")).toBeNull();
        expect(normaliseColor("inherit")).toBeNull();
    });
});

describe("tally", () => {
    it("sums weights and counts occurrences", () => {
        const result = tally([
            observe("#fff", "background", 100),
            observe("#fff", "background", 50),
            observe("#000", "text", 0, 10)
        ]);

        expect(result[0]).toMatchObject({ value: "#fff", weight: 150, occurrences: 2 });
        expect(result[1]).toMatchObject({ value: "#000", weight: 10, occurrences: 1 });
    });

    it("records every property class a value appeared on", () => {
        const result = tally([observe("#fff", "background", 100), observe("#fff", "border", 20)]);

        expect(result[0].properties).toEqual(["background", "border"]);
    });

    it("ranks by weight, not by raw count", () => {
        // The brief's own example: a colour on two hundred small icons must not outrank the hero.
        const icons = Array.from({ length: 200 }, () => observe("#111", "border", 16));
        const hero = observe("#eee", "background", 900_000);

        const result = tally([...icons, hero]);

        expect(result[0].value).toBe("#eee");
        expect(result[1].occurrences).toBe(200);
    });

    it("drops zero-weight observations", () => {
        expect(tally([observe("#fff", "background", 0)])).toEqual([]);
    });

    it("is stable for equal weights, so two runs agree", () => {
        const observations = [observe("#bbb", "background", 10), observe("#aaa", "background", 10)];
        expect(tally(observations).map(v => v.value)).toEqual(["#aaa", "#bbb"]);
    });
});

describe("tallyColors", () => {
    it("normalises before tallying, so spellings do not fragment counts", () => {
        const result = tallyColors([
            observe("#FFF", "background", 100),
            observe("rgb(255,255,255)", "background", 100),
            observe("#ffffff", "background", 100)
        ]);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ value: "#ffffff", weight: 300, occurrences: 3 });
    });

    it("skips values it cannot parse rather than tallying them as strings", () => {
        expect(tallyColors([observe("inherit", "text", 0, 50)])).toEqual([]);
    });
});

describe("quantiseColors", () => {
    it("merges near-identical variants into the heavier one", () => {
        const tallied = tallyColors([
            observe("#1f6feb", "background", 1000),
            observe("#1f6fea", "background", 10),
            observe("#206feb", "background", 5)
        ]);

        const result = quantiseColors(tallied);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ value: "#1f6feb", weight: 1015, occurrences: 3 });
    });

    it("leaves deliberately distinct colours alone", () => {
        const tallied = tallyColors([
            observe("#0b1220", "background", 100),
            observe("#5a6b82", "background", 100)
        ]);

        expect(quantiseColors(tallied)).toHaveLength(2);
    });

    it("does not merge a solid colour with a translucent one", () => {
        const tallied = tallyColors([
            observe("#000000", "background", 100),
            observe("rgba(0, 0, 0, 0.5)", "background", 90)
        ]);

        expect(quantiseColors(tallied)).toHaveLength(2);
    });

    it("re-sorts after merging, since merges move weight around", () => {
        const tallied = tallyColors([
            observe("#aaaaaa", "background", 100),
            observe("#1f6feb", "background", 60),
            observe("#1f6fea", "background", 60)
        ]);

        const result = quantiseColors(tallied);

        // The merged pair (60 + 60) now outranks the single heavier colour it started behind.
        // Which of the two tied variants survives is decided by the stable tie-break in `tally`.
        expect(result[0].weight).toBe(120);
        expect(result[0].value).toBe("#1f6fea");
        expect(result[1].value).toBe("#aaaaaa");
    });

    it("honours a custom merge radius", () => {
        const tallied = tallyColors([
            observe("#000000", "background", 100),
            observe("#0a0a0a", "background", 50)
        ]);

        expect(quantiseColors(tallied, DEFAULT_QUANTISE_DISTANCE)).toHaveLength(2);
        expect(quantiseColors(tallied, 40)).toHaveLength(1);
    });
});

describe("normaliseLength", () => {
    it("converts to px and rounds away sub-pixel noise", () => {
        expect(normaliseLength("16px")).toBe("16px");
        expect(normaliseLength("16.0px")).toBe("16px");
        expect(normaliseLength("1rem")).toBe("16px");
        expect(normaliseLength("15.9px")).toBe("16px");
    });

    it("keeps half-pixel values, which hairline borders really use", () => {
        expect(normaliseLength("0.5px")).toBe("0.5px");
    });

    it("returns null for anything that is not a simple length", () => {
        expect(normaliseLength("auto")).toBeNull();
        expect(normaliseLength("50%")).toBeNull();
        expect(normaliseLength("calc(100% - 1rem)")).toBeNull();
    });
});

describe("tallyLengths", () => {
    it("tallies equivalent lengths together", () => {
        const result = tallyLengths([
            observe("1rem", "background", 10),
            observe("16px", "background", 10)
        ]);

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ value: "16px", weight: 20 });
    });
});

describe("topN", () => {
    it("caps a list without failing on short input", () => {
        expect(topN([1, 2, 3], 2)).toEqual([1, 2]);
        expect(topN([1], 5)).toEqual([1]);
        expect(topN([1, 2], 0)).toEqual([]);
    });
});

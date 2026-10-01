import { describe, expect, it } from "vitest";
import type { ClusterMember, ComponentProp } from "~/domain/artifacts.js";
import { coverMemberTexts } from "./textCoverage.js";

const member = (texts: string[]): ClusterMember =>
    ({
        signature: "s",
        url: "/",
        sectionIndex: 0,
        box: { x: 0, y: 0, width: 1440, height: 100 },
        cropRef: "crop",
        screenshotRef: "shot",
        digest: { texts, imageCount: 0, headingCount: 0, linkCount: 0, structure: "div" }
    }) as unknown as ClusterMember;

const prop = (name: string, observedValues: string[], fields?: ComponentProp[]): ComponentProp =>
    ({ name, type: "string", observedValues, fields }) as unknown as ComponentProp;

describe("coverMemberTexts", () => {
    it("counts a text an observed value holds exactly", () => {
        const result = coverMemberTexts(
            [member(["Contact Us"])],
            [prop("heading", ["Contact Us"])]
        );
        expect(result).toEqual({ covered: 1, uncovered: [], uncoveredCount: 0 });
    });

    it("reports a text no prop can hold", () => {
        const result = coverMemberTexts(
            [member(["Contact Us", "Schedule a Tour"])],
            [prop("heading", ["Contact Us"])]
        );
        expect(result.covered).toBe(1);
        expect(result.uncovered).toEqual(["Schedule a Tour"]);
        expect(result.uncoveredCount).toBe(1);
    });

    it("accepts a row built from values observed in separate fields", () => {
        // Observations are deduped per field, so the row the page showed cannot be rebuilt from them;
        // a contract that holds both halves holds the row.
        const result = coverMemberTexts(
            [member(["Monday: 9:00AM to 6:00PM"])],
            [prop("hours", [], [prop("day", ["Monday"]), prop("time", ["9:00AM to 6:00PM"])])]
        );
        expect(result.uncoveredCount).toBe(0);
    });

    it("does not require non-content strings to be held", () => {
        const result = coverMemberTexts(
            [member(["keyboard_arrow_down", ".", ","])],
            [prop("heading", [])]
        );
        expect(result).toEqual({ covered: 0, uncovered: [], uncoveredCount: 0 });
    });

    it("counts a text shared by several members once", () => {
        const result = coverMemberTexts(
            [member(["Apply Now"]), member(["Apply Now"]), member(["Apply Now"])],
            [prop("heading", [])]
        );
        expect(result.uncoveredCount).toBe(1);
    });

    it("covers the members the reference section does not represent", () => {
        // The case the narrowing has to keep safe: a second member's heading is not in the reference
        // section's text at all, and the contract is what has to hold it.
        const reference = member(["Explore Fenway Forward"]);
        const other = member(["Studio, 1 and 2 Bedroom Apartments"]);
        const covered = coverMemberTexts(
            [reference, other],
            [prop("heading", ["Explore Fenway Forward", "Studio, 1 and 2 Bedroom Apartments"])]
        );
        expect(covered.uncoveredCount).toBe(0);

        const notCovered = coverMemberTexts(
            [reference, other],
            [prop("heading", ["Explore Fenway Forward"])]
        );
        expect(notCovered.uncovered).toEqual(["Studio, 1 and 2 Bedroom Apartments"]);
    });
});

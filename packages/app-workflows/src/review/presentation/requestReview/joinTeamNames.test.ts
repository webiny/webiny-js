import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { joinTeamNames } from "./joinTeamNames.js";
import { getNobodyEligibleNote } from "./getNobodyEligibleNote.js";

describe("joinTeamNames", () => {
    it("joins zero, one, two and three names", () => {
        expect(joinTeamNames([])).toBe("");
        expect(joinTeamNames(["Editors"])).toBe("Editors");
        expect(joinTeamNames(["Editors", "Legal"])).toBe("Editors and Legal");
        expect(joinTeamNames(["Editors", "Legal", "Sales"])).toBe("Editors, Legal and Sales");
    });
});

describe("getNobodyEligibleNote", () => {
    const TAIL = "other than you can review this step. Ask a workflow manager to add reviewers.";

    it("keeps the plain sentence when the step has no team names", () => {
        expect(getNobodyEligibleNote([])).toBe(`Nobody ${TAIL}`);
    });

    it("names one, two and three teams", () => {
        expect(getNobodyEligibleNote(["Editors"])).toBe(`Nobody in Editors ${TAIL}`);
        expect(getNobodyEligibleNote(["Editors", "Legal"])).toBe(
            `Nobody in Editors and Legal ${TAIL}`
        );
        expect(getNobodyEligibleNote(["A", "B", "C"])).toBe(`Nobody in A, B and C ${TAIL}`);
    });
});

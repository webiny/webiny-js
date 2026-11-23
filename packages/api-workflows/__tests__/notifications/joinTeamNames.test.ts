import { describe, expect, it } from "vitest";
import { joinTeamNames } from "~/domain/notifications/joinTeamNames.js";

describe("joinTeamNames", () => {
    it.each([
        { names: [], expected: "" },
        { names: ["Legal"], expected: "Legal" },
        { names: ["Legal", "Marketing"], expected: "Legal and Marketing" },
        { names: ["Legal", "Marketing", "Design"], expected: "Legal, Marketing and 1 more" },
        { names: ["A", "B", "C", "D"], expected: "A, B and 2 more" }
    ])("joins $names as `$expected`", ({ names, expected }) => {
        expect(joinTeamNames(names)).toBe(expected);
    });

    it("trims names and leaves blank ones out", () => {
        expect(joinTeamNames(["  Legal ", "", "   ", "Marketing"])).toBe("Legal and Marketing");
    });

    it("keeps the given order", () => {
        expect(joinTeamNames(["Marketing", "Legal"])).toBe("Marketing and Legal");
    });

    it("counts only the non-blank names past the first two", () => {
        expect(joinTeamNames(["Legal", " ", "Editors", "", "Design", "Sales"])).toBe(
            "Legal, Editors and 2 more"
        );
    });
});

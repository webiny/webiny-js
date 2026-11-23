import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getStepLevelWarnings } from "./getStepLevelWarnings.js";

describe("getStepLevelWarnings", () => {
    it("keeps the step's own warning lines in order", () => {
        const lines = getStepLevelWarnings([
            { text: "Legal has no members.", severity: "warning" },
            { text: "Rule 1: The folder no longer exists.", severity: "warning", ruleId: "r1" },
            { text: "Rule 2: Legal is not a reviewing team.", severity: "error", ruleId: "r2" },
            { text: "Compliance has no members.", severity: "warning" }
        ]);

        expect(lines).toEqual(["Legal has no members.", "Compliance has no members."]);
    });

    it("never turns an error line into a warning", () => {
        expect(getStepLevelWarnings([{ text: "Broken.", severity: "error" }])).toEqual([]);
    });
});

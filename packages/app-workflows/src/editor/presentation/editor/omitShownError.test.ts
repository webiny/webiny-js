import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import { omitShownError } from "./omitShownError.js";

const warning = (text: string): StepWarningLine => {
    return { text, severity: "warning" };
};

const error = (text: string): StepWarningLine => {
    return { text, severity: "error" };
};

describe("omitShownError (R299, R303)", () => {
    it("keeps every line when no error is shown", () => {
        const lines = [
            warning("Legal has no members."),
            error("Rule 1: Choose who this rule assigns to.")
        ];

        expect(omitShownError(lines, null)).toEqual(lines);
    });

    it("drops the line that is identical to the shown error", () => {
        const lines = [
            error("Rule 1: Choose who this rule assigns to."),
            warning("Rule 2: The folder no longer exists.")
        ];
        const shown = { text: "Rule 1: Choose who this rule assigns to.", rulePrefix: "Rule 1: " };

        expect(omitShownError(lines, shown)).toEqual([
            warning("Rule 2: The folder no longer exists.")
        ]);
    });

    it("drops the live error of the shown rule when it is worded differently", () => {
        const lines = [error("Rule 1: Ana Kovac is no longer in the reviewing teams.")];
        const shown = {
            text: "Rule 1: The target user is not a member of the step's teams.",
            rulePrefix: "Rule 1: "
        };

        expect(omitShownError(lines, shown)).toEqual([]);
    });

    it("keeps a warning of the shown rule and the errors of other rules", () => {
        const lines = [
            warning("Rule 1: The folder no longer exists."),
            error("Rule 2: The assigned user was deleted."),
            error("Rule 10: The team was deleted.")
        ];
        const shown = { text: "Rule 1: Choose who this rule assigns to.", rulePrefix: "Rule 1: " };

        expect(omitShownError(lines, shown)).toEqual(lines);
    });

    it("drops only an identical line for a strip that names no rule", () => {
        const lines = [
            error("Rule 1: Choose who this rule assigns to."),
            warning("Enter a title for this step.")
        ];
        const shown = { text: "Enter a title for this step.", rulePrefix: null };

        expect(omitShownError(lines, shown)).toEqual([
            error("Rule 1: Choose who this rule assigns to.")
        ]);
    });

    it("keeps the order of the other lines and does not change the input", () => {
        const lines = [warning("A"), warning("B"), warning("A"), warning("C")];

        const result = omitShownError(lines, { text: "A", rulePrefix: null });

        expect(result).toEqual([warning("B"), warning("C")]);
        expect(lines).toHaveLength(4);
    });
});

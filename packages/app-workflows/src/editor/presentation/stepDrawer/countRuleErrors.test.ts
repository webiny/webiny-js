import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { StepFormRuleError } from "~/editor/presentation/stepForm/StepFormOptions.js";
import { countRuleErrors } from "./countRuleErrors.js";

const issue = (overrides: Partial<RuleIssue>): RuleIssue => {
    return {
        ruleId: "r-1",
        index: 0,
        kind: "error",
        field: "target",
        message: "Live error.",
        ...overrides
    };
};

const serverError = (overrides: Partial<StepFormRuleError>): StepFormRuleError => {
    return { ruleId: "r-1", field: "target", message: "Server says no.", ...overrides };
};

describe("countRuleErrors", () => {
    it("is zero without errors", () => {
        expect(countRuleErrors([], [])).toBe(0);
    });

    it("counts the live errors of every rule, and never a warning", () => {
        const issues = [
            issue({ ruleId: "r-1" }),
            issue({ ruleId: "r-2" }),
            issue({ ruleId: "r-2", kind: "warning", field: "folder" })
        ];

        expect(countRuleErrors([], issues)).toBe(2);
    });

    it("counts a server error and the live error of the same rule and field once", () => {
        expect(countRuleErrors([serverError({})], [issue({})])).toBe(1);
    });

    it("counts a server error and a live error of another field of the rule apart", () => {
        const issues = [issue({ field: "requesterTeam" })];

        expect(countRuleErrors([serverError({})], issues)).toBe(2);
    });

    it("counts each rule's server error", () => {
        const errors = [serverError({ ruleId: "r-1" }), serverError({ ruleId: "r-2" })];

        expect(countRuleErrors(errors, [])).toBe(2);
    });
});

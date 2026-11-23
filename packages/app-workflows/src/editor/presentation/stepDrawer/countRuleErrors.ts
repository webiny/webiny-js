import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { StepFormRuleError } from "~/editor/presentation/stepForm/StepFormOptions.js";

/*
 * The error messages the rule cards show: per rule and field one message, the server error if
 * there is one, else the live error issue (the merge `getRuleFieldMessages` does). Warnings never
 * count. Pure.
 */
export const countRuleErrors = (errors: StepFormRuleError[], issues: RuleIssue[]): number => {
    const keys = new Set<string>();
    for (const error of errors) {
        keys.add(`${error.ruleId}:${error.field}`);
    }
    for (const issue of issues) {
        if (issue.kind === "error") {
            keys.add(`${issue.ruleId}:${issue.field}`);
        }
    }
    return keys.size;
};

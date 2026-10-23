import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { RuleErrorVm } from "./abstractions.js";

/*
 * A server error on a rule replaces the live error of the same rule and field (R303), so the message
 * is shown once. Live warnings are never replaced. Pure.
 */
export const dropOverriddenIssues = (issues: RuleIssue[], errors: RuleErrorVm[]): RuleIssue[] => {
    if (errors.length === 0) {
        return issues;
    }
    return issues.filter(issue => {
        if (issue.kind !== "error") {
            return true;
        }
        return !errors.some(error => {
            return error.ruleId === issue.ruleId && error.field === issue.field;
        });
    });
};

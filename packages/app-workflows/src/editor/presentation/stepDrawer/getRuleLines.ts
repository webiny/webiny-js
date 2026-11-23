import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { RuleErrorVm } from "./abstractions.js";

export interface RuleLinesParams {
    // The ids of the form's rules in order; the position gives the number of `Rule {n}: `.
    ruleIds: string[];
    // The live issues (already without the ones a server error replaced) and the server errors.
    issues: RuleIssue[];
    errors: RuleErrorVm[];
}

/*
 * The `Rule {n}: {message}` lines of the drawer's warnings block (R312): for each rule in order its
 * server errors (severity `error`), then its live issues (the issue's own severity). Every line
 * carries its rule's id. A rule that is not in the list gives no line. Pure.
 */
export const getRuleLines = (params: RuleLinesParams): StepWarningLine[] => {
    const lines: StepWarningLine[] = [];
    for (const [index, ruleId] of params.ruleIds.entries()) {
        const prefix = `Rule ${index + 1}: `;
        for (const error of params.errors) {
            if (error.ruleId === ruleId) {
                lines.push({ text: `${prefix}${error.message}`, severity: "error", ruleId });
            }
        }
        // Errors before warnings within a rule, the same order as the card.
        const ruleIssues = params.issues.filter(issue => issue.ruleId === ruleId);
        const ordered = [
            ...ruleIssues.filter(issue => issue.kind === "error"),
            ...ruleIssues.filter(issue => issue.kind === "warning")
        ];
        for (const issue of ordered) {
            lines.push({ text: `${prefix}${issue.message}`, severity: issue.kind, ruleId });
        }
    }
    return lines;
};

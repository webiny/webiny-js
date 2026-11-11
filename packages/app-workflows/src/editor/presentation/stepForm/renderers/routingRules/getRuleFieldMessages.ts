import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { StepFormRuleError } from "../../StepFormOptions.js";
import type { RuleFieldMessages } from "./RuleFieldMessages.js";

function getFieldMessage(
    field: RuleIssue["field"],
    issues: RuleIssue[],
    errors: StepFormRuleError[]
): string | null {
    const serverError = errors.find(error => error.field === field);
    if (serverError !== undefined) {
        return serverError.message;
    }
    const liveError = issues.find(issue => issue.kind === "error" && issue.field === field);
    if (liveError !== undefined) {
        return liveError.message;
    }
    return null;
}

/*
 * The messages of one rule card (R299, R303): per field the server error if there is one, else the
 * live error issue, so a server error replaces the live message and never doubles it; the warnings
 * in order; and whether the rule holds an error at all.
 */
export const getRuleFieldMessages = (
    issues: RuleIssue[],
    errors: StepFormRuleError[]
): RuleFieldMessages => {
    const target = getFieldMessage("target", issues, errors);
    const requesterUser = getFieldMessage("requesterUser", issues, errors);
    const requesterTeam = getFieldMessage("requesterTeam", issues, errors);
    const folder = getFieldMessage("folder", issues, errors);
    const warnings = issues.filter(issue => issue.kind === "warning").map(issue => issue.message);
    const hasError =
        target !== null || requesterUser !== null || requesterTeam !== null || folder !== null;

    return { target, requesterUser, requesterTeam, folder, hasError, warnings };
};

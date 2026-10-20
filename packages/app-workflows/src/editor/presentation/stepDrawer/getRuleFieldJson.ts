import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";

// The JSON of the rule field a rule error shows under; compared later to see if the field was edited.
export const getRuleFieldJson = (rule: RuleValue, field: RuleIssue["field"]): string => {
    if (field === "requesterUser") {
        return JSON.stringify(rule.requesterUserId);
    }
    if (field === "requesterTeam") {
        return JSON.stringify(rule.requesterTeamId);
    }
    if (field === "folder") {
        return JSON.stringify(rule.folder);
    }
    return JSON.stringify(rule.target);
};

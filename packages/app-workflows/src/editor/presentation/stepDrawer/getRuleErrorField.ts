import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";

const PREFIX = "config.assignment.rules.";

/*
 * The rule field a normalised server field (the index already dropped, R303) belongs to: `target`,
 * `requesterUser`, `requesterTeam` or `folder`; null for the card itself (`id`, the rule as a whole)
 * and for a path the editor has no control for (an unknown condition). Pure.
 */
export const getRuleErrorField = (field: string): RuleIssue["field"] | null => {
    if (!field.startsWith(PREFIX)) {
        return null;
    }
    const path = field.slice(PREFIX.length);
    if (path === "target" || path.startsWith("target.")) {
        return "target";
    }
    if (path === "conditions.requesterUserId") {
        return "requesterUser";
    }
    if (path === "conditions.requesterTeamId") {
        return "requesterTeam";
    }
    if (path === "conditions.folder" || path.startsWith("conditions.folder.")) {
        return "folder";
    }
    return null;
};

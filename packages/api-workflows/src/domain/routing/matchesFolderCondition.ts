import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingRuleFacts } from "./types.js";
import { matchesFolderTypeCondition } from "./matchesFolderTypeCondition.js";

/**
 * Whether a rule's folder condition holds. The target folder must be of the rule folder's type
 * (`matchesFolderTypeCondition`); then the rule folder must be the target folder or, with
 * `includeDescendants`, one of its ancestors. A rule without one matches. Pure.
 */
export const matchesFolderCondition = (
    conditions: RoutingRuleConditions,
    facts: RoutingRuleFacts
): boolean => {
    const folder = conditions.folder;
    if (!folder) {
        return true;
    }
    if (!matchesFolderTypeCondition(conditions, facts) || !facts.folder) {
        return false;
    }
    if (folder.id === facts.folder.id) {
        return true;
    }
    return !!folder.includeDescendants && facts.folderChainIds.includes(folder.id);
};

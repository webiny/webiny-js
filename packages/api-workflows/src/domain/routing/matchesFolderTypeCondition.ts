import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingRuleLocalFacts } from "./types.js";

/**
 * Whether the target can match a rule's folder condition at all: it needs a target folder of the
 * same type, so a target in the root matches no folder condition. A rule without one matches.
 * Pure; needs no lookup.
 */
export const matchesFolderTypeCondition = (
    conditions: RoutingRuleConditions,
    facts: RoutingRuleLocalFacts
): boolean => {
    if (!conditions.folder) {
        return true;
    }
    return !!facts.folder && conditions.folder.type === facts.folder.type;
};

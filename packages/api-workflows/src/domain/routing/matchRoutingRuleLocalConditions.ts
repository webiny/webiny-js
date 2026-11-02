import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingRuleLocalFacts } from "./types.js";
import { matchesRequesterUserCondition } from "./matchesRequesterUserCondition.js";
import { matchesFolderTypeCondition } from "./matchesFolderTypeCondition.js";

/**
 * Whether the conditions that need no lookup hold (spec 6, R113): the requester, the model and
 * the folder type (a folder condition needs a target folder of the same type). Pure. Checked
 * first, so a rule that fails here never reads the requester's teams or the folder chain.
 */
export const matchRoutingRuleLocalConditions = (
    conditions: RoutingRuleConditions,
    facts: RoutingRuleLocalFacts
): boolean => {
    if (!matchesRequesterUserCondition(conditions, facts)) {
        return false;
    }
    if (conditions.modelId && conditions.modelId !== facts.modelId) {
        return false;
    }
    return matchesFolderTypeCondition(conditions, facts);
};

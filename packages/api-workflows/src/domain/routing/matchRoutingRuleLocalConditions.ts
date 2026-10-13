import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingRuleLocalFacts } from "./types.js";

/**
 * Whether the conditions that need no lookup hold (spec 6, R113): the requester, the model and
 * the folder type (a folder condition needs a target folder of the same type). Pure. Checked
 * first, so a rule that fails here never reads the requester's teams or the folder chain.
 */
export const matchRoutingRuleLocalConditions = (
    conditions: RoutingRuleConditions,
    facts: RoutingRuleLocalFacts
): boolean => {
    if (conditions.requesterUserId && conditions.requesterUserId !== facts.requesterId) {
        return false;
    }
    if (conditions.modelId && conditions.modelId !== facts.modelId) {
        return false;
    }
    if (conditions.folder && (!facts.folder || conditions.folder.type !== facts.folder.type)) {
        return false;
    }
    return true;
};

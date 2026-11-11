import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingRuleLocalFacts } from "./types.js";

/** Whether a rule's requester condition holds. A rule without one matches. Pure. */
export const matchesRequesterUserCondition = (
    conditions: RoutingRuleConditions,
    facts: RoutingRuleLocalFacts
): boolean => {
    return !conditions.requesterUserId || conditions.requesterUserId === facts.requesterId;
};

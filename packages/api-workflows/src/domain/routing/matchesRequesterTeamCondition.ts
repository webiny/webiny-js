import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingRuleFacts } from "./types.js";

/** Whether a rule's requester team condition holds. A rule without one matches. Pure. */
export const matchesRequesterTeamCondition = (
    conditions: RoutingRuleConditions,
    facts: RoutingRuleFacts
): boolean => {
    return (
        !conditions.requesterTeamId || facts.requesterTeamIds.includes(conditions.requesterTeamId)
    );
};

import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingRuleFacts } from "./types.js";
import { matchRoutingRuleLocalConditions } from "./matchRoutingRuleLocalConditions.js";
import { matchesRequesterTeamCondition } from "./matchesRequesterTeamCondition.js";
import { matchesFolderCondition } from "./matchesFolderCondition.js";

/**
 * Whether every condition of a rule holds (spec 6, R113). Pure. A rule without conditions
 * matches. The checks that need no lookup run first (`matchRoutingRuleLocalConditions`). Each
 * condition is decided by its own predicate, which the rule inspector shares
 * (`getFailedRoutingConditions`), so both always agree.
 */
export const matchRoutingRuleConditions = (
    conditions: RoutingRuleConditions,
    facts: RoutingRuleFacts
): boolean => {
    return (
        matchRoutingRuleLocalConditions(conditions, facts) &&
        matchesRequesterTeamCondition(conditions, facts) &&
        matchesFolderCondition(conditions, facts)
    );
};

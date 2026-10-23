import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingCondition, RoutingRuleFacts } from "./types.js";
import { matchesRequesterUserCondition } from "./matchesRequesterUserCondition.js";
import { matchesRequesterTeamCondition } from "./matchesRequesterTeamCondition.js";
import { matchesFolderCondition } from "./matchesFolderCondition.js";

/**
 * The conditions of a rule that do not hold, in the order requester, requester's team, folder
 * (R289). Pure; the facts must carry the requester's teams and the folder chain, so the inspector
 * reads them for every rule it explains. A failed `modelId` condition names nothing here: it
 * fails the rule (`matchRoutingRuleConditions`) but the editor has no such condition. Uses the
 * same per-condition predicates as `matchRoutingRuleConditions`.
 */
export const getFailedRoutingConditions = (
    conditions: RoutingRuleConditions,
    facts: RoutingRuleFacts
): RoutingCondition[] => {
    const failed: RoutingCondition[] = [];
    if (!matchesRequesterUserCondition(conditions, facts)) {
        failed.push("requesterUser");
    }
    if (!matchesRequesterTeamCondition(conditions, facts)) {
        failed.push("requesterTeam");
    }
    if (!matchesFolderCondition(conditions, facts)) {
        failed.push("folder");
    }
    return failed;
};

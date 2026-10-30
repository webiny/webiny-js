import type { RoutingRule } from "~/domain/workflow/types.js";
import type { RoutingTraceEntry } from "./types.js";

/**
 * The trace entries of the rules from `fromIndex` on, after the rule that decided (R289): outcome
 * `notEvaluated`, no reason, no failed conditions. Pure.
 */
export const listNotEvaluatedTrace = (
    rules: RoutingRule[],
    fromIndex: number
): RoutingTraceEntry[] => {
    return rules.slice(fromIndex).map((rule): RoutingTraceEntry => {
        return { ruleId: rule.id, outcome: "notEvaluated", reason: null, failedConditions: [] };
    });
};

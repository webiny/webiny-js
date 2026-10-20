import type { RoutingInspectionTraceEntry } from "~/domain/routing/types.js";
import type { RoutingTraceEntry } from "~/domain/routing/types.js";

/**
 * Every entry carries its failed conditions, empty unless a rule did not match (R289). Pure.
 */
export const toInspectionTrace = (trace: RoutingTraceEntry[]): RoutingInspectionTraceEntry[] => {
    return trace.map(entry => {
        return {
            ruleId: entry.ruleId,
            outcome: entry.outcome,
            reason: entry.reason,
            failedConditions: [...(entry.failedConditions ?? [])]
        };
    });
};

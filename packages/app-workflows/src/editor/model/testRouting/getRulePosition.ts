import type { RoutingInspection } from "~/editor/domain/types.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

/*
 * The 1-based number of a rule: its position in the rules of the request, else its position in the
 * inspection's trace; `null` when the id is in neither.
 */
export const getRulePosition = (
    ruleId: string,
    inspection: RoutingInspection,
    rules: RuleValue[]
): number | null => {
    const ruleIndex = rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
        return ruleIndex + 1;
    }
    const traceIndex = inspection.trace.findIndex(entry => entry.ruleId === ruleId);
    if (traceIndex !== -1) {
        return traceIndex + 1;
    }
    return null;
};

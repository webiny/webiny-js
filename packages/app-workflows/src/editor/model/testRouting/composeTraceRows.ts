import type { RoutingInspection } from "~/editor/domain/types.js";
import type { RoutingTraceEntry } from "~/editor/domain/types.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { describeRule } from "~/editor/model/rules/describeRule.js";
import { describeFailedConditions } from "./describeFailedConditions.js";
import type { TestRoutingContext } from "./TestRoutingContext.js";
import type { TestRoutingRowVm } from "./TestRoutingResultVm.js";
import type { TestRoutingTag } from "./TestRoutingResultVm.js";

const ALL_MATCH = "All conditions match.";
const EARLIER_RULE = "An earlier rule matched.";
// Copy gap 10: a row with no named condition and no server reason.
const UNNAMED_CONDITION = "A condition on this rule does not match.";

function getTag(entry: RoutingTraceEntry): TestRoutingTag {
    if (entry.outcome === "matched") {
        return "Matched";
    }
    if (entry.outcome === "notMatched") {
        return "Not matched";
    }
    return "Skipped";
}

function getReason(
    entry: RoutingTraceEntry,
    rule: RuleValue | null,
    context: TestRoutingContext
): string {
    if (entry.outcome === "notEvaluated") {
        return EARLIER_RULE;
    }
    if (entry.outcome === "matched") {
        return entry.reason === null ? ALL_MATCH : entry.reason;
    }
    if (entry.outcome === "notMatched" && rule !== null) {
        const named = describeFailedConditions(entry.failedConditions, rule, context.references);
        if (named !== "") {
            return named;
        }
    }
    return entry.reason === null ? UNNAMED_CONDITION : entry.reason;
}

function composeRow(
    entry: RoutingTraceEntry,
    index: number,
    context: TestRoutingContext
): TestRoutingRowVm {
    const ruleIndex = context.rules.findIndex(item => item.id === entry.ruleId);
    const rule = ruleIndex === -1 ? null : context.rules[ruleIndex];
    const position = ruleIndex === -1 ? index + 1 : ruleIndex + 1;

    let label = `Rule ${position}`;
    if (rule !== null) {
        const summary = describeRule(rule, context.references);
        label = `Rule ${position}: ${summary}`;
    }

    return {
        ruleId: entry.ruleId,
        tag: getTag(entry),
        label,
        reason: getReason(entry, rule, context)
    };
}

// One row per rule of the inspection's trace, in the server's order (R289, R301).
export const composeTraceRows = (
    inspection: RoutingInspection,
    context: TestRoutingContext
): TestRoutingRowVm[] => {
    return inspection.trace.map((entry, index) => composeRow(entry, index, context));
};

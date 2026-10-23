import type { RoutingInspection } from "~/editor/domain/types.js";
import { getInspectionTeamName } from "./getInspectionTeamName.js";
import { getRulePosition } from "./getRulePosition.js";
import type { TestRoutingContext } from "./TestRoutingContext.js";

const NO_RULE_POOL = "No rule matched; waits in the team pool.";
const ALL_SKIPPED = "Sent to team pool: all candidates were skipped.";

// The design names the team when the step has exactly one reviewing team.
function composeNoRuleReason(context: TestRoutingContext): string {
    const teamIds = context.stepTeamIds;
    if (teamIds === undefined || teamIds.length !== 1) {
        return NO_RULE_POOL;
    }
    const team = getInspectionTeamName(teamIds[0], context);

    return `No rule matched; waits in the ${team} team pool.`;
}

function composeStrategyChoice(
    inspection: RoutingInspection,
    ownerName: string,
    position: number | null,
    context: TestRoutingContext
): string {
    const verb = inspection.source === "roundRobin" ? "round-robin" : "least-loaded";
    const sentence = `${verb.charAt(0).toUpperCase()}${verb.slice(1)} chose ${ownerName}.`;
    if (inspection.narrowedTeamId === null || position === null) {
        return sentence;
    }
    const team = getInspectionTeamName(inspection.narrowedTeamId, context);

    return `Rule ${position} narrowed it to the ${team} team; ${verb} chose ${ownerName}.`;
}

function composePoolReason(
    inspection: RoutingInspection,
    position: number | null,
    context: TestRoutingContext
): string {
    if (inspection.strategy !== "none") {
        return ALL_SKIPPED;
    }
    if (position === null) {
        return composeNoRuleReason(context);
    }
    if (inspection.narrowedTeamId === null) {
        return `Assigned by rule ${position}`;
    }
    const team = getInspectionTeamName(inspection.narrowedTeamId, context);

    return `Rule ${position} sent it to the ${team} team pool.`;
}

/*
 * The owner's reason line (R301). `position` is the rule's number; a rule id that is in neither
 * the rules nor the trace counts as no rule.
 */
export const composeReasonLine = (
    inspection: RoutingInspection,
    context: TestRoutingContext
): string => {
    let position: number | null = null;
    if (inspection.ruleId !== null) {
        position = getRulePosition(inspection.ruleId, inspection, context.rules);
    }

    const owner = inspection.owner;
    if (owner === null) {
        return composePoolReason(inspection, position, context);
    }
    if (inspection.source === "roundRobin" || inspection.source === "leastLoaded") {
        return composeStrategyChoice(inspection, owner.displayName, position, context);
    }
    if (position !== null) {
        return `Assigned by rule ${position}`;
    }
    return "";
};

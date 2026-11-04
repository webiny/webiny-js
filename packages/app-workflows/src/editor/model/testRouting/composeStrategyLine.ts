import type { RoutingInspection } from "~/editor/domain/types.js";
import { getInspectionUserName } from "./getInspectionUserName.js";
import type { TestRoutingContext } from "./TestRoutingContext.js";

const NOT_USED = "Not used: a rule chose the reviewer.";
const NONE = "None: the step waits in the team pool.";

function composeRotation(
    inspection: RoutingInspection,
    ownerId: string,
    ownerName: string,
    context: TestRoutingContext
): string {
    const names = inspection.candidateIds.map(id => {
        if (id === ownerId) {
            return ownerName;
        }
        return getInspectionUserName(id, context);
    });
    if (names.length === 0) {
        names.push(ownerName);
    }
    let others = "";
    if (inspection.candidateCount > inspection.candidateIds.length) {
        others = " and others";
    }

    return `Round-robin across ${names.join(", ")}${others}: ${ownerName} is next in rotation.`;
}

/*
 * The strategy row of the result (R301): not used when a rule chose the reviewer, the strategy's
 * own sentence otherwise.
 */
export const composeStrategyLine = (
    inspection: RoutingInspection,
    context: TestRoutingContext
): string => {
    if (inspection.source === "rule") {
        return NOT_USED;
    }
    if (inspection.strategy === "none") {
        return NONE;
    }

    const owner = inspection.owner;
    if (owner === null) {
        const name = inspection.strategy === "roundRobin" ? "Round-robin" : "Least-loaded";
        return `${name}: no eligible candidate.`;
    }
    if (inspection.strategy === "leastLoaded") {
        return `Least-loaded chose ${owner.displayName}: fewest open reviews.`;
    }

    return composeRotation(inspection, owner.id, owner.displayName, context);
};

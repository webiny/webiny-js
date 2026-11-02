import type { ReviewStep } from "~/review/domain/types.js";

/*
 * "Why this owner" (design prototype, D127): hidden for AI and automation owners (R216, QBZ-63)
 * and for a step without an assignment. A rule id is not a name, so a rule reads "Assigned by a
 * routing rule". Pure.
 */
export const getWhyOwner = (step: ReviewStep): string | null => {
    if (step.owner !== null && step.owner.type !== "user") {
        return null;
    }
    const assignment = step.assignment;
    if (assignment === null) {
        return null;
    }

    let by = "someone";
    if (assignment.by) {
        by = assignment.by.displayName;
    }

    switch (assignment.source) {
        case "picked":
            return "Picked by requester";
        case "rule":
            return "Assigned by a routing rule";
        case "roundRobin":
            return "Round-robin";
        case "leastLoaded":
            return "Least-loaded";
        case "pool":
            return assignment.reason ? assignment.reason : "Sent to team pool";
        case "poolStart":
            return "Started from team pool";
        case "takeOver":
            return `Taken over by ${by}`;
        case "reassign":
            return `Reassigned by ${by}`;
        default:
            return null;
    }
};

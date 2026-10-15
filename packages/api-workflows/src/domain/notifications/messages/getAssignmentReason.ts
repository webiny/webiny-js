import type { AssignmentSource } from "~/domain/assignment/types.js";

/**
 * The `{reason}` of an `assigned` message (R189a). `rule` carries no rule name (A62: a rule id is
 * not a name); a pool start, take over, reassign or a missing source reads "assigned to you".
 * Pure.
 */
export const getAssignmentReason = (
    source: AssignmentSource | null | undefined,
    requesterName: string
): string => {
    switch (source) {
        case "picked":
            return `picked by ${requesterName}`;
        case "rule":
            return "assigned by a routing rule";
        case "roundRobin":
            return "assigned by round-robin";
        case "leastLoaded":
            return "assigned by least-loaded";
        default:
            return "assigned to you";
    }
};

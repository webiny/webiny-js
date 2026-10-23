import type { RoutingUser } from "./types.js";

/**
 * Round robin (R115): the candidates (sorted by user id) starting with the first id after the
 * last assignee, wrapping around. A last assignee who is no longer a candidate still marks the
 * position; without one the order is unchanged. Pure.
 */
export const orderRoundRobin = (
    candidates: RoutingUser[],
    lastAssigneeId: string | null
): RoutingUser[] => {
    if (!lastAssigneeId) {
        return [...candidates];
    }
    const index = candidates.findIndex(candidate => candidate.id > lastAssigneeId);
    if (index === -1) {
        return [...candidates];
    }
    return [...candidates.slice(index), ...candidates.slice(0, index)];
};

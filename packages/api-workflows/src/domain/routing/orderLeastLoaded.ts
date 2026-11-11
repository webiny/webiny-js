import type { RoutingUser } from "./types.js";

/**
 * Least loaded (R115, D137): fewest in-review reviews first; ties go to the least recently
 * assigned (no entry = never assigned = least recent), then to user id order. `loads` and
 * `lastAssignedOn` are keyed by user id; a missing load is 0. Pure.
 */
export const orderLeastLoaded = (
    candidates: RoutingUser[],
    loads: ReadonlyMap<string, number>,
    lastAssignedOn: ReadonlyMap<string, string>
): RoutingUser[] => {
    return [...candidates].sort((a, b) => {
        const load = (loads.get(a.id) ?? 0) - (loads.get(b.id) ?? 0);
        if (load !== 0) {
            return load;
        }
        const aOn = lastAssignedOn.get(a.id);
        const bOn = lastAssignedOn.get(b.id);
        if (aOn !== bOn) {
            if (!aOn) {
                return -1;
            }
            if (!bOn) {
                return 1;
            }
            const time = Date.parse(aOn) - Date.parse(bOn);
            if (time !== 0) {
                return time;
            }
        }
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
};

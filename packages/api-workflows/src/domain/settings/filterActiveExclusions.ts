import type { WorkflowExclusion } from "./types.js";

/** Expired entries stay stored until removed (D105) but are filtered on read (spec 4.4). */
export const filterActiveExclusions = (
    exclusions: WorkflowExclusion[],
    now: Date
): WorkflowExclusion[] => {
    return exclusions.filter(exclusion => {
        return !exclusion.endsOn || Date.parse(exclusion.endsOn) > now.getTime();
    });
};

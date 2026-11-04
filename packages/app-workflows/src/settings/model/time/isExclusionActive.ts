import type { WorkflowExclusion } from "~/settings/domain/types.js";

// Active without an end date or while the end is still ahead, the server's `filterActiveExclusions` rule (R319).
export const isExclusionActive = (exclusion: WorkflowExclusion, now: number): boolean => {
    if (exclusion.endsOn === null) {
        return true;
    }
    const endsAt = Date.parse(exclusion.endsOn);
    return endsAt > now;
};

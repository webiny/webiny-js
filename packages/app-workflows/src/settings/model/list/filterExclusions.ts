import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { isExclusionActive } from "~/settings/model/time/isExclusionActive.js";
import type { ExclusionTab } from "./ExclusionTab.js";
import type { FilterExclusionsParams } from "./FilterExclusionsParams.js";

const matchesTab = (exclusion: WorkflowExclusion, tab: ExclusionTab, now: number): boolean => {
    if (tab === "all") {
        return true;
    }
    const active = isExclusionActive(exclusion, now);
    if (tab === "active") {
        return active;
    }
    return !active;
};

// The rows of a tab, then of the user filter, in the list's order (R322).
export const filterExclusions = (
    list: WorkflowExclusion[],
    params: FilterExclusionsParams
): WorkflowExclusion[] => {
    const { tab, userId, now } = params;

    return list.filter(exclusion => {
        if (!matchesTab(exclusion, tab, now)) {
            return false;
        }
        if (userId === null) {
            return true;
        }
        return exclusion.userId === userId;
    });
};

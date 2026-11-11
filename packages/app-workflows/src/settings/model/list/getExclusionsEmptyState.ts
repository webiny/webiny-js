import type { EmptyStateParams } from "./EmptyStateParams.js";
import type { ExclusionsEmptyVm } from "./ExclusionsEmptyVm.js";

const NO_ONE_EXCLUDED = "Everyone in reviewing teams can be assigned automatically.";

/*
 * The empty state of the table (R322, design DS:241): no entries at all; an empty Expired tab;
 * an empty Active or All tab, with or without a user filter (`Add exclusion` only without one).
 */
export const getExclusionsEmptyState = (params: EmptyStateParams): ExclusionsEmptyVm => {
    const { total, tab, userFiltered } = params;

    if (total === 0) {
        return {
            title: "No exclusions",
            text: NO_ONE_EXCLUDED,
            showAdd: true
        };
    }
    if (tab === "expired") {
        return {
            title: "No expired exclusions",
            text: "Exclusions move here after their end date.",
            showAdd: false
        };
    }
    if (userFiltered) {
        return {
            title: "No exclusions for this user",
            text: NO_ONE_EXCLUDED,
            showAdd: false
        };
    }
    return {
        title: "No active exclusions",
        text: NO_ONE_EXCLUDED,
        showAdd: true
    };
};

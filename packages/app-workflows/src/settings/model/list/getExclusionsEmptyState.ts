import type { EmptyStateParams } from "./EmptyStateParams.js";
import type { ExclusionsEmptyVm } from "./ExclusionsEmptyVm.js";

const NO_ONE_EXCLUDED = "Everyone in reviewing teams can be assigned automatically.";

/*
 * The empty state of the table (R322, design DS:241): no entries at all; a search that matches no
 * one, on any tab; an empty Expired tab; an empty Active or All tab (`Add exclusion` shows there).
 */
export const getExclusionsEmptyState = (params: EmptyStateParams): ExclusionsEmptyVm => {
    const { total, tab, search } = params;

    if (total === 0) {
        return {
            title: "No exclusions",
            text: "Everyone in the reviewing teams can be assigned automatically.",
            showAdd: true,
            showClearSearch: false
        };
    }
    if (search !== "") {
        return {
            title: `No one matches \u201c${search}\u201d`,
            text: null,
            showAdd: false,
            showClearSearch: true
        };
    }
    if (tab === "expired") {
        return {
            title: "No expired exclusions",
            text: "Exclusions move here after their end date.",
            showAdd: false,
            showClearSearch: false
        };
    }
    return {
        title: "No active exclusions",
        text: NO_ONE_EXCLUDED,
        showAdd: true,
        showClearSearch: false
    };
};

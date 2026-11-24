import type { EmptyStateParams } from "./EmptyStateParams.js";
import type { ExclusionsEmptyVm } from "./ExclusionsEmptyVm.js";

const NO_EXCLUSIONS: ExclusionsEmptyVm = {
    title: "No exclusions",
    text: "Everyone in the reviewing teams can be assigned automatically.",
    showAdd: true,
    showClearSearch: false
};

const NO_EXPIRED_EXCLUSIONS: ExclusionsEmptyVm = {
    title: "No expired exclusions",
    text: "Exclusions move here after their end date.",
    showAdd: false,
    showClearSearch: false
};

/*
 * The empty state of the table (R322, design DS:241, B27): a search that matches no one in a
 * non-empty list, on any tab; an empty Expired tab; an empty Active or All tab (`Add exclusion`
 * shows there).
 */
export const getExclusionsEmptyState = (params: EmptyStateParams): ExclusionsEmptyVm => {
    const { total, tab, search } = params;

    if (total > 0 && search !== "") {
        return {
            title: `No one matches \u201c${search}\u201d`,
            text: null,
            showAdd: false,
            showClearSearch: true
        };
    }
    if (tab === "expired") {
        return NO_EXPIRED_EXCLUSIONS;
    }
    return NO_EXCLUSIONS;
};

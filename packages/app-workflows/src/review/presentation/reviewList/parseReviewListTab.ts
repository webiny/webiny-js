import type { ReviewListTab } from "./abstractions.js";
import { REVIEW_LIST_TABS } from "./reviewListTabs.js";

// Narrows a string (a route parameter, a tab trigger value) to a list tab, or `null`.
export const parseReviewListTab = (value: string | null | undefined): ReviewListTab | null => {
    const tab = REVIEW_LIST_TABS.find(item => item.value === value);
    if (!tab) {
        return null;
    }
    return tab.value;
};

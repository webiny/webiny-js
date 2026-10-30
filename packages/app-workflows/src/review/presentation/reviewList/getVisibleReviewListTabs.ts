import type { WorkflowsPermissionSet } from "~/review/domain/types.js";
import type { ReviewListTabVm } from "./abstractions.js";
import { isReviewListTabAvailable } from "./isReviewListTabAvailable.js";
import { REVIEW_LIST_TABS } from "./reviewListTabs.js";

// The tabs this viewer may open, in design order (README 8, QBZ-29).
export const getVisibleReviewListTabs = (
    permissions: WorkflowsPermissionSet
): ReviewListTabVm[] => {
    return REVIEW_LIST_TABS.filter(tab => {
        return isReviewListTabAvailable(tab.value, permissions);
    });
};

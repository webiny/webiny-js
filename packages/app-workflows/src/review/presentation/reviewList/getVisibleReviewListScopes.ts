import type { WorkflowsPermissionSet } from "~/review/domain/types.js";
import type { ReviewListScopeVm } from "./abstractions.js";
import { isReviewListScopeAvailable } from "./isReviewListScopeAvailable.js";
import { REVIEW_LIST_SCOPES } from "./reviewListScopes.js";

// The scopes this viewer may open, in design order (B2 design 1).
export const getVisibleReviewListScopes = (
    permissions: WorkflowsPermissionSet
): ReviewListScopeVm[] => {
    return REVIEW_LIST_SCOPES.filter(scope => {
        return isReviewListScopeAvailable(scope.value, permissions);
    });
};

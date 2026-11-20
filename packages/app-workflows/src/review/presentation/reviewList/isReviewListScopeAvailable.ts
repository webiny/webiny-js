import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import type { WorkflowsPermissionSet } from "~/review/domain/types.js";

/*
 * Every scope is open to every viewer except All, which the server lists only for a viewer with
 * `reassign` or full access (B2 design 1). A display gate (R259): the server keeps its check.
 */
export const isReviewListScopeAvailable = (
    scope: ReviewListScope,
    permissions: WorkflowsPermissionSet
): boolean => {
    if (scope !== "all") {
        return true;
    }
    return permissions.fullAccess || permissions.reassign;
};

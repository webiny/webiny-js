import type { WorkflowsPermissionSet } from "~/review/domain/types.js";
import type { ReviewListTab } from "./abstractions.js";

/*
 * Every tab is open to every viewer except Failed steps, which the server lists only for a viewer
 * with `reassign` or full access (D112, D162). A display gate (R259): the server keeps its check.
 */
export const isReviewListTabAvailable = (
    tab: ReviewListTab,
    permissions: WorkflowsPermissionSet
): boolean => {
    if (tab !== "failedSteps") {
        return true;
    }
    return permissions.fullAccess || permissions.reassign;
};

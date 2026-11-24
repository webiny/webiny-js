import type { BoundWorkflowPresenter } from "~/review/presentation/boundWorkflow/abstractions.js";
import type { ListPublishRow } from "./ListPublishRow.js";
import { getRowPublishDisabledReason } from "./getRowPublishDisabledReason.js";

export interface SelectionPublishDisabledReasonParams {
    workflowStatus: BoundWorkflowPresenter.Status;
    // The selected rows the list has loaded.
    rows: ListPublishRow[];
    // Every row of the list is selected, also the ones not loaded yet.
    allSelected: boolean;
    // The list has rows that are not loaded yet.
    hasMore: boolean;
}

/*
 * Why the bulk "Publish" may not run: the first reason a selected row may not be published (the
 * row rule). A published row is skipped: its row action is "Unpublish". With every row selected
 * while some are not loaded yet, those are unknown, so a namespace that is not known to be unbound
 * blocks it as a row with no review would. `null` means it may run. Pure.
 */
export const getSelectionPublishDisabledReason = (
    params: SelectionPublishDisabledReasonParams
): string | null => {
    const { workflowStatus, rows, allSelected, hasMore } = params;

    if (allSelected && hasMore && workflowStatus !== "unbound") {
        return getRowPublishDisabledReason({
            workflowStatus,
            reviewState: null,
            isUnpublished: false
        });
    }

    for (const row of rows) {
        if (row.isPublished) {
            continue;
        }
        const reason = getRowPublishDisabledReason({
            workflowStatus,
            reviewState: row.reviewState,
            isUnpublished: row.isUnpublished
        });

        if (reason !== null) {
            return reason;
        }
    }

    return null;
};

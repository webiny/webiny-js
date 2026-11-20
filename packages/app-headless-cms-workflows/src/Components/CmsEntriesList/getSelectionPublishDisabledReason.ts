import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { CmsModelWorkflowPresenter } from "~/presentation/modelWorkflow/abstractions.js";
import type { ICmsEntryMetaWithReview } from "~/types.js";
import { getRowPublishDisabledReason } from "./getRowPublishDisabledReason.js";

export interface SelectionPublishDisabledReasonParams {
    workflowStatus: CmsModelWorkflowPresenter.Status;
    // The selected rows the list has loaded.
    entries: CmsContentEntry[];
    // Every entry of the list is selected, also the ones not loaded yet.
    allSelected: boolean;
}

/*
 * Why the bulk "Publish" may not run: the first reason a selected row may not be published (the
 * row rule). With every entry selected, the entries not loaded yet are unknown, so a model that is
 * not known to be unbound blocks it as an entry with no review would. `null` means it may run. Pure.
 */
export const getSelectionPublishDisabledReason = (
    params: SelectionPublishDisabledReasonParams
): string | null => {
    const { workflowStatus, entries, allSelected } = params;

    if (allSelected && workflowStatus !== "unbound") {
        return getRowPublishDisabledReason({
            workflowStatus,
            reviewState: null,
            isUnpublished: false
        });
    }

    for (const entry of entries) {
        const meta: ICmsEntryMetaWithReview = entry.meta;
        const reason = getRowPublishDisabledReason({
            workflowStatus,
            reviewState: meta.system?.workflow?.reviewState ?? null,
            isUnpublished: meta.status === "unpublished"
        });

        if (reason !== null) {
            return reason;
        }
    }

    return null;
};

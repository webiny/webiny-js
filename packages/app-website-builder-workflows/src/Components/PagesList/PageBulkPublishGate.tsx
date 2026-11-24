import React, { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { usePageListPresenter } from "@webiny/app-website-builder/presentation/pages/PageList/PageListPresenterProvider.js";
import { BoundWorkflowFeature } from "@webiny/app-workflows/review/presentation/boundWorkflow/feature.js";
import { getSelectionPublishDisabledReason } from "@webiny/app-workflows/review/presentation/listActions/getSelectionPublishDisabledReason.js";
import { WB_PAGE_APP } from "~/constants.js";
import { PageBulkPublishBlocked } from "./PageBulkPublishBlocked.js";
import { toListPublishRow } from "./toListPublishRow.js";

export interface PageBulkPublishGateProps {
    element: React.ReactElement | undefined;
}

/*
 * Shows the bulk "Publish" disabled with the reason when the API would refuse a selected page
 * (the row rule of `PagePublishGate`), instead of running and failing. The base action is only
 * configured for users who may publish.
 */
export const PageBulkPublishGate = createReactiveComponent((props: PageBulkPublishGateProps) => {
    const listPresenter = usePageListPresenter();
    const { presenter } = useFeature(BoundWorkflowFeature);

    useEffect(() => {
        void presenter.load(WB_PAGE_APP);
    }, [presenter]);

    const { rows, selection, pagination } = listPresenter.list.vm;
    const selectedRows = rows
        .filter(row => {
            return selection.selectedIds.has(row.entryId);
        })
        .map(toListPublishRow);
    const reason = getSelectionPublishDisabledReason({
        workflowStatus: presenter.vm.status,
        rows: selectedRows,
        allSelected: selection.allSelected,
        hasMore: pagination.hasMore
    });

    if (reason === null) {
        return props.element ?? null;
    }

    return <PageBulkPublishBlocked reason={reason} />;
});

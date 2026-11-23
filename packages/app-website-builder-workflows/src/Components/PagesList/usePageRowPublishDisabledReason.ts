import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { usePage } from "@webiny/app-website-builder/presentation/pages/PageList/hooks/usePage.js";
import { BoundWorkflowFeature } from "@webiny/app-workflows/review/presentation/boundWorkflow/feature.js";
import { getRowPublishDisabledReason } from "@webiny/app-workflows/review/presentation/listActions/getRowPublishDisabledReason.js";
import { WB_PAGE_APP } from "~/constants.js";
import { toListPublishRow } from "./toListPublishRow.js";

/*
 * Why the list row's page may not be published now (`getRowPublishDisabledReason`), loading
 * whether a workflow binds the pages (one cached lookup for the whole list); `null` when
 * publishing is allowed. Read it inside a reactive component.
 */
export const usePageRowPublishDisabledReason = (): string | null => {
    const { page } = usePage();
    const { presenter } = useFeature(BoundWorkflowFeature);

    useEffect(() => {
        void presenter.load(WB_PAGE_APP);
    }, [presenter]);

    const row = toListPublishRow(page);

    return getRowPublishDisabledReason({
        workflowStatus: presenter.vm.status,
        reviewState: row.reviewState,
        isUnpublished: row.isUnpublished
    });
};

import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { useEntry } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import { useModel } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { BoundWorkflowFeature } from "@webiny/app-workflows/review/presentation/boundWorkflow/feature.js";
import { getRowPublishDisabledReason } from "@webiny/app-workflows/review/presentation/listActions/getRowPublishDisabledReason.js";
import { createAppName } from "~/utils/appName.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";
import { toListPublishRow } from "./toListPublishRow.js";

/*
 * Why the list row's revision may not be published now (`getRowPublishDisabledReason`), loading
 * whether the row's model is bound to a workflow; `null` when publishing is allowed or the model
 * is not reviewable. Read it inside a reactive component.
 */
export const useRowPublishDisabledReason = (): string | null => {
    const { entry } = useEntry();
    const { model } = useModel();
    const { presenter } = useFeature(BoundWorkflowFeature);
    const namespace = createAppName(model);

    useEffect(() => {
        void presenter.load(namespace);
    }, [presenter, namespace]);

    if (!isReviewableModel(model)) {
        return null;
    }

    const row = toListPublishRow(entry);

    return getRowPublishDisabledReason({
        workflowStatus: presenter.vm.status,
        reviewState: row.reviewState,
        isUnpublished: row.isUnpublished
    });
};

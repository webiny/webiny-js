import React, { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useContentEntriesPresenter } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { useModel } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { usePermission } from "@webiny/app-headless-cms/admin/hooks/usePermission.js";
import { CmsModelWorkflowFeature } from "~/presentation/modelWorkflow/feature.js";
import { createAppName } from "~/utils/appName.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";
import { BulkPublishBlocked } from "./BulkPublishBlocked.js";
import { getSelectionPublishDisabledReason } from "./getSelectionPublishDisabledReason.js";

export interface BulkPublishGateProps {
    children?: React.ReactNode;
}

/*
 * Shows the bulk "Publish" disabled with the reason when the API would refuse a selected entry
 * (the row rule of `PublishGate`), instead of running and failing.
 */
export const BulkPublishGate = createReactiveComponent((props: BulkPublishGateProps) => {
    const { model } = useModel();
    const { canPublish } = usePermission();
    const listPresenter = useContentEntriesPresenter();
    const { presenter } = useFeature(CmsModelWorkflowFeature);
    const namespace = createAppName(model);

    useEffect(() => {
        void presenter.load(namespace);
    }, [presenter, namespace]);

    if (!isReviewableModel(model) || !canPublish("cms.contentEntry")) {
        return <>{props.children}</>;
    }

    const { rows, selection } = listPresenter.list.vm;
    const entries = rows.filter(row => {
        return selection.selectedIds.has(row.id);
    });
    const reason = getSelectionPublishDisabledReason({
        workflowStatus: presenter.vm.status,
        entries,
        allSelected: selection.allSelected
    });

    if (reason === null) {
        return <>{props.children}</>;
    }

    return <BulkPublishBlocked reason={reason} />;
});

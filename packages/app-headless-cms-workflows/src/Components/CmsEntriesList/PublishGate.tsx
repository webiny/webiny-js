import React, { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useEntry } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import { useModel } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { usePermission } from "@webiny/app-headless-cms/admin/hooks/usePermission.js";
import { CmsModelWorkflowFeature } from "~/presentation/modelWorkflow/feature.js";
import type { ICmsEntryMetaWithReview } from "~/types.js";
import { createAppName } from "~/utils/appName.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";
import { getRowPublishDisabledReason } from "./getRowPublishDisabledReason.js";
import { PublishBlocked } from "./PublishBlocked.js";

export interface PublishGateProps {
    children?: React.ReactNode;
}

/*
 * Leaves the base status action alone when it shows "Unpublish" or nothing (no publish
 * permission); otherwise shows "Publish" disabled with the reason whenever the API would refuse it
 * (`Workflows/Review/PublishBlocked`): a revision whose review is in progress or rejected, or a
 * revision of a bound model with no approved review.
 */
export const PublishGate = createReactiveComponent((props: PublishGateProps) => {
    const { entry } = useEntry();
    const { model } = useModel();
    const { canPublish, canUnpublish } = usePermission();
    const { presenter } = useFeature(CmsModelWorkflowFeature);
    const namespace = createAppName(model);

    useEffect(() => {
        void presenter.load(namespace);
    }, [presenter, namespace]);

    const meta: ICmsEntryMetaWithReview = entry.meta;
    const showsUnpublish = meta.status === "published" && canUnpublish("cms.contentEntry");

    if (!isReviewableModel(model) || showsUnpublish || !canPublish("cms.contentEntry")) {
        return <>{props.children}</>;
    }

    const reason = getRowPublishDisabledReason({
        workflowStatus: presenter.vm.status,
        reviewState: meta.system?.workflow?.reviewState ?? null,
        isUnpublished: meta.status === "unpublished"
    });

    if (reason === null) {
        return <>{props.children}</>;
    }

    return <PublishBlocked reason={reason} />;
});

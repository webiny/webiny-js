import React from "react";
import { RegisterFeature, useFeatureFlags } from "@webiny/app-admin";
import { WbContentReviews } from "~/Components/ContentReviews/WbContentReviews.js";
import { WebsiteBuilderWorkflowsMenu } from "~/Routes/index.js";
import { PageEditorConfig, PagesList } from "~/Components/index.js";
import { PageListWorkflowsFeature } from "~/presentation/page/PageList/feature.js";
import { PageGetWorkflowsFeature } from "~/presentation/page/PageGet/feature.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";
import { WbReviewFeature } from "~/features/gateway/feature.js";
import { WbWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
import { WbWorkflowEditorFeature } from "~/features/editorGateway/feature.js";
import { WbReviewCacheFeature } from "~/features/cache/feature.js";
import { WbReviewTrashFeature } from "~/features/trash/feature.js";
import { RevisionListWorkflowsFeature } from "~/presentation/page/RevisionList/feature.js";

export const WebsiteBuilderWorkflows = () => {
    const featureFlags = useFeatureFlags();

    if (!featureFlags.isEnabled("advancedPublishingWorkflow")) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={WbReviewFeature} />
            <RegisterFeature feature={WbWorkflowEditorFeature} />
            <RegisterFeature feature={WbWorkflowEditorMountingFeature} />
            <WbContentReviews />
            <RegisterFeature feature={PageListWorkflowsFeature} />
            <RegisterFeature feature={PageGetWorkflowsFeature} />
            <RegisterFeature feature={WbPageReviewFeature} />
            <RegisterFeature feature={WbReviewCacheFeature} />
            <RegisterFeature feature={WbReviewTrashFeature} />
            <RegisterFeature feature={RevisionListWorkflowsFeature} />
            <WebsiteBuilderWorkflowsMenu />
            <PageEditorConfig />
            <PagesList />
        </>
    );
};

import React from "react";
import { RegisterFeature, useFeatureFlags } from "@webiny/app-admin";
import { CmsWorkflowEditor } from "~/Routes/index.js";
import { CmsEntryReviewBar } from "~/Components/ContentEntryForm/index.js";
import { CmsEntryReviewBlockedActions } from "~/Components/ContentEntryForm/index.js";
import { CmsEntryReviewFormLock } from "~/Components/ContentEntryForm/index.js";
import { CmsEntryReviewNewRevision } from "~/Components/ContentEntryForm/index.js";
import { CmsEntryReviewScheduleMenuItem } from "~/Components/ContentEntryForm/index.js";
import { CmsContentReviews } from "~/Components/ContentReviews/CmsContentReviews.js";
import { CmsContentReviewsSidebarItem } from "~/Components/ContentReviews/CmsContentReviewsSidebarItem.js";
import { CmsEntryReviewFeature } from "~/features/editorReview/feature.js";
import { CmsReviewMoveEntryAction } from "~/Components/CmsEntriesList/CmsReviewMoveEntryAction.js";
import { CmsReviewScheduleEntryAction } from "~/Components/CmsEntriesList/CmsReviewScheduleEntryAction.js";
import { CmsWorkflowsFeature } from "~/presentation/feature.js";
import { CmsWorkflowsCacheFeature } from "~/features/feature.js";
import { CmsWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
import { CmsReviewFeature } from "~/features/gateway/feature.js";
import { CmsWorkflowEditorFeature } from "~/features/editorGateway/feature.js";
import { CmsContentReviewsPresenterFeature } from "~/presentation/contentReviews/feature.js";
import { CmsReviewTrashFeature } from "~/features/trash/feature.js";
import { ModelDeleteWorkflowError } from "~/Components/ModelDelete/ModelDeleteWorkflowError.js";

export const CmsWorkflows = () => {
    const featureFlags = useFeatureFlags();

    if (!featureFlags.isEnabled("advancedPublishingWorkflow")) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={CmsReviewFeature} />
            <RegisterFeature feature={CmsWorkflowEditorFeature} />
            <RegisterFeature feature={CmsContentReviewsPresenterFeature} />
            <RegisterFeature feature={CmsWorkflowsFeature} />
            <RegisterFeature feature={CmsWorkflowsCacheFeature} />
            <RegisterFeature feature={CmsWorkflowEditorMountingFeature} />
            <RegisterFeature feature={CmsEntryReviewFeature} />
            <RegisterFeature feature={CmsReviewTrashFeature} />
            <CmsContentReviews />
            <CmsContentReviewsSidebarItem />
            <CmsWorkflowEditor />
            <CmsEntryReviewBar />
            <CmsEntryReviewFormLock />
            <CmsEntryReviewBlockedActions />
            <CmsEntryReviewScheduleMenuItem />
            <CmsEntryReviewNewRevision />
            <CmsReviewMoveEntryAction />
            <CmsReviewScheduleEntryAction />
            <ModelDeleteWorkflowError />
        </>
    );
};

import React from "react";
import { RegisterFeature, useFeatureFlags } from "@webiny/app-admin";
import { CmsWorkflowsEditor } from "~/Routes/index.js";
import { CmsEntryReviewBar } from "~/Components/ContentEntryForm/index.js";
import { CmsEntryReviewBlockedActions } from "~/Components/ContentEntryForm/index.js";
import { CmsEntryReviewFormLock } from "~/Components/ContentEntryForm/index.js";
import { CmsEntryReviewNewRevision } from "~/Components/ContentEntryForm/index.js";
import { CmsEntryReviewScheduleMenuItem } from "~/Components/ContentEntryForm/index.js";
import { CmsEntriesWorkflowStateListFooterMenu } from "~/Components/CmsEntriesWorkflowStateList/index.js";
import { ListOpenInNewWindow } from "~/Components/OptionItem/OpenInNewWindow.js";
import { CmsEntryReviewFeature } from "~/features/editorReview/feature.js";
import { CmsReviewMoveEntryAction } from "~/Components/CmsEntriesList/CmsReviewMoveEntryAction.js";
import { CmsWorkflowsFeature } from "~/presentation/feature.js";
import { CmsWorkflowsCacheFeature } from "~/features/feature.js";
import { CmsWorkflowsEditorPresenterFeature } from "~/presentation/cmsWorkflowsEditor/feature.js";
import { CmsReviewFeature } from "~/features/gateway/feature.js";

export const CmsWorkflows = () => {
    const featureFlags = useFeatureFlags();

    if (!featureFlags.isEnabled("advancedPublishingWorkflow")) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={CmsReviewFeature} />
            <RegisterFeature feature={CmsWorkflowsFeature} />
            <RegisterFeature feature={CmsWorkflowsCacheFeature} />
            <RegisterFeature feature={CmsWorkflowsEditorPresenterFeature} />
            <RegisterFeature feature={CmsEntryReviewFeature} />
            <ListOpenInNewWindow />
            <CmsEntriesWorkflowStateListFooterMenu />
            <CmsWorkflowsEditor />
            <CmsEntryReviewBar />
            <CmsEntryReviewFormLock />
            <CmsEntryReviewBlockedActions />
            <CmsEntryReviewScheduleMenuItem />
            <CmsEntryReviewNewRevision />
            <CmsReviewMoveEntryAction />
        </>
    );
};

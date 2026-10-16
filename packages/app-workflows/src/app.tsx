import React from "react";
import { RegisterFeature, useFeatureFlags } from "@webiny/app-admin";
import { SecurityPermissions } from "~/presentation/permissions/index.js";
import { WorkflowsPermissionsFeature } from "~/features/permissions/feature.js";
import { WorkflowsFeature } from "~/features/feature.js";
import { TargetReviewPresenterFeature } from "~/review/presentation/targetReview/feature.js";
import { ReviewActionDialogPresenterFeature } from "~/review/presentation/actionDialog/feature.js";
import { ReviewServicesFeature } from "~/review/feature.js";
import { WorkflowStatePresenterFeature } from "~/presentation/workflowState/feature.js";
import { WorkflowStateListPresenterFeature } from "~/presentation/workflowStateList/feature.js";
import { WorkflowStatesWidgetPresenterFeature } from "~/presentation/workflowStatesWidget/feature.js";
import { WorkflowsEditorPresenterFeature } from "~/presentation/workflowsEditor/feature.js";
import { ContentReviews } from "~/presentation/ContentReviews.js";

export const WorkflowsAdminApp = () => {
    const featureFlags = useFeatureFlags();

    if (!featureFlags.isEnabled("advancedPublishingWorkflow")) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={WorkflowsPermissionsFeature} />
            <RegisterFeature feature={WorkflowsFeature} />
            <RegisterFeature feature={ReviewServicesFeature} />
            <RegisterFeature feature={WorkflowStatePresenterFeature} />
            <RegisterFeature feature={WorkflowStateListPresenterFeature} />
            <RegisterFeature feature={WorkflowStatesWidgetPresenterFeature} />
            <RegisterFeature feature={WorkflowsEditorPresenterFeature} />
            <RegisterFeature feature={TargetReviewPresenterFeature} />
            <RegisterFeature feature={ReviewActionDialogPresenterFeature} />
            <SecurityPermissions />
            <ContentReviews />
        </>
    );
};

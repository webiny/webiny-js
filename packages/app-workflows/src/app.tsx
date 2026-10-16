import React from "react";
import { RegisterFeature, useFeatureFlags } from "@webiny/app-admin";
import { SecurityPermissions } from "~/presentation/permissions/index.js";
import { WorkflowsPermissionsFeature } from "~/features/permissions/feature.js";
import { WorkflowsFeature } from "~/features/feature.js";
import { TargetReviewPresenterFeature } from "~/review/presentation/targetReview/feature.js";
import { ReviewActionDialogPresenterFeature } from "~/review/presentation/actionDialog/feature.js";
import { ReviewerPickerPresenterFeature } from "~/review/presentation/reviewerPicker/feature.js";
import { RequestReviewPresenterFeature } from "~/review/presentation/requestReview/feature.js";
import { ReviewDetailsPresenterFeature } from "~/review/presentation/reviewDetails/feature.js";
import { ReviewListPresenterFeature } from "~/review/presentation/reviewList/feature.js";
import { ReassignDialogPresenterFeature } from "~/review/presentation/actionDialog/reassignFeature.js";
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
            <RegisterFeature feature={ReviewerPickerPresenterFeature} />
            <RegisterFeature feature={ReassignDialogPresenterFeature} />
            <RegisterFeature feature={RequestReviewPresenterFeature} />
            <RegisterFeature feature={ReviewDetailsPresenterFeature} />
            <RegisterFeature feature={ReviewListPresenterFeature} />
            <SecurityPermissions />
            <ContentReviews />
        </>
    );
};

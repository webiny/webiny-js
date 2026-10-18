import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { SecurityPermissions } from "~/presentation/permissions/index.js";
import { WorkflowsPermissionsFeature } from "~/features/permissions/feature.js";
import { ActiveReviewTrashFeature } from "~/review/trash/feature.js";
import { ActiveReviewWarningConfig } from "~/review/trash/components/ActiveReviewWarningConfig.js";
import { WorkflowsFeature } from "~/features/feature.js";
import { TargetReviewPresenterFeature } from "~/review/presentation/targetReview/feature.js";
import { ReviewActionDialogPresenterFeature } from "~/review/presentation/actionDialog/feature.js";
import { ReviewerPickerPresenterFeature } from "~/review/presentation/reviewerPicker/feature.js";
import { RequestReviewPresenterFeature } from "~/review/presentation/requestReview/feature.js";
import { ReviewDetailsPresenterFeature } from "~/review/presentation/reviewDetails/feature.js";
import { ReviewListPresenterFeature } from "~/review/presentation/reviewList/feature.js";
import { ReviewWidgetPresenterFeature } from "~/review/presentation/reviewWidget/feature.js";
import { ReassignDialogPresenterFeature } from "~/review/presentation/actionDialog/reassignFeature.js";
import { ReviewServicesFeature } from "~/review/feature.js";
import { WorkflowEditorServicesFeature } from "~/editor/feature.js";
import { WorkflowsEditorPresenterFeature } from "~/presentation/workflowsEditor/feature.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { WorkflowEditorConfig } from "~/editor/WorkflowEditorConfig.js";

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
            <RegisterFeature feature={WorkflowEditorServicesFeature} />
            <RegisterFeature feature={WorkflowEditorPresenterFeature} />
            <RegisterFeature feature={WorkflowsEditorPresenterFeature} />
            <RegisterFeature feature={TargetReviewPresenterFeature} />
            <RegisterFeature feature={ReviewActionDialogPresenterFeature} />
            <RegisterFeature feature={ReviewerPickerPresenterFeature} />
            <RegisterFeature feature={ReassignDialogPresenterFeature} />
            <RegisterFeature feature={RequestReviewPresenterFeature} />
            <RegisterFeature feature={ReviewDetailsPresenterFeature} />
            <RegisterFeature feature={ReviewListPresenterFeature} />
            <RegisterFeature feature={ReviewWidgetPresenterFeature} />
            <RegisterFeature feature={ActiveReviewTrashFeature} />
            <ActiveReviewWarningConfig />
            <WorkflowEditorConfig />
            <SecurityPermissions />
        </>
    );
};

import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { useFeatureFlags } from "@webiny/app-admin";
import { SecurityPermissions } from "~/presentation/permissions/index.js";
import { WorkflowsPermissionsFeature } from "~/features/permissions/feature.js";
import { ActiveReviewTrashFeature } from "~/review/trash/feature.js";
import { ActiveReviewWarningConfig } from "~/review/trash/components/ActiveReviewWarningConfig.js";
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
import { WorkflowSettingsServicesFeature } from "~/settings/feature.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { StepDrawerPresenterFeature } from "~/editor/presentation/stepDrawer/feature.js";
import { WorkflowEditorConfig } from "~/editor/WorkflowEditorConfig.js";
import { ExclusionsSettings } from "~/settings/mounting/ExclusionsSettings.js";
import { ExclusionsPagePresenterFeature } from "~/settings/presentation/exclusionsPage/feature.js";
import { ExclusionDialogPresenterFeature } from "~/settings/presentation/exclusionDialog/feature.js";
import { RemoveExclusionDialogPresenterFeature } from "~/settings/presentation/removeDialog/feature.js";

export const WorkflowsAdminApp = () => {
    const featureFlags = useFeatureFlags();

    if (!featureFlags.isEnabled("advancedPublishingWorkflow")) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={WorkflowsPermissionsFeature} />
            <RegisterFeature feature={ReviewServicesFeature} />
            <RegisterFeature feature={WorkflowEditorServicesFeature} />
            <RegisterFeature feature={WorkflowSettingsServicesFeature} />
            <RegisterFeature feature={WorkflowEditorPresenterFeature} />
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
            <RegisterFeature feature={StepDrawerPresenterFeature} />
            <RegisterFeature feature={ExclusionsPagePresenterFeature} />
            <RegisterFeature feature={ExclusionDialogPresenterFeature} />
            <RegisterFeature feature={RemoveExclusionDialogPresenterFeature} />
            <WorkflowEditorConfig />
            <ExclusionsSettings />
            <SecurityPermissions />
        </>
    );
};

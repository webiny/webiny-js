import React from "react";
import { RegisterFeature, Wcp } from "@webiny/app-admin";
import { SecurityPermissions } from "~/presentation/permissions/index.js";
import { WorkflowsPermissionsFeature } from "~/features/permissions/feature.js";
import { WorkflowsFeature } from "~/features/feature.js";
import { WorkflowStatePresenterFeature } from "~/presentation/workflowState/feature.js";
import { WorkflowStateListPresenterFeature } from "~/presentation/workflowStateList/feature.js";
import { WorkflowStatesWidgetPresenterFeature } from "~/presentation/workflowStatesWidget/feature.js";
import { WorkflowsEditorPresenterFeature } from "~/presentation/workflowsEditor/feature.js";
import { ContentReviews } from "~/presentation/ContentReviews.js";

export const WorkflowsAdminApp = () => {
    return (
        <Wcp.CanUseWorkflows>
            <RegisterFeature feature={WorkflowsPermissionsFeature} />
            <RegisterFeature feature={WorkflowsFeature} />
            <RegisterFeature feature={WorkflowStatePresenterFeature} />
            <RegisterFeature feature={WorkflowStateListPresenterFeature} />
            <RegisterFeature feature={WorkflowStatesWidgetPresenterFeature} />
            <RegisterFeature feature={WorkflowsEditorPresenterFeature} />
            <SecurityPermissions />
            <ContentReviews />
        </Wcp.CanUseWorkflows>
    );
};

import React from "react";
import { RegisterFeature, Wcp } from "@webiny/app-admin";
import { SecurityPermissions } from "~/Components/WorkflowsPermissions/index.js";
import { ContentReviews } from "./ContentReviews.js";
import { WorkflowsPermissionsFeature } from "~/features/permissions/feature.js";

/**
 * Should be registered in app-serverless-cms.
 */
export const WorkflowsAdminApp = () => {
    return (
        <Wcp.CanUseWorkflows>
            <RegisterFeature feature={WorkflowsPermissionsFeature} />
            <SecurityPermissions />
            <ContentReviews />
        </Wcp.CanUseWorkflows>
    );
};

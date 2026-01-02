import React from "react";
import { Wcp } from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import { workflowsPermissions } from "~/Components/WorkflowsPermissions/index.js";
import { ContentReviews } from "./ContentReviews.js";

const WorkflowsPermissions = () => {
    plugins.register([workflowsPermissions]);

    return null;
};

/**
 * Should be registered in app-serverless-cms.
 */
export const WorkflowsAdminApp = () => {
    return (
        <Wcp.CanUseWorkflows>
            <WorkflowsPermissions />
            <ContentReviews />
        </Wcp.CanUseWorkflows>
    );
};

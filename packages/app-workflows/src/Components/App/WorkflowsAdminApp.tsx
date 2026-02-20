import React from "react";
import { Wcp } from "@webiny/app-admin";
import { SecurityPermissions } from "~/Components/WorkflowsPermissions/index.js";
import { ContentReviews } from "./ContentReviews.js";

/**
 * Should be registered in app-serverless-cms.
 */
export const WorkflowsAdminApp = () => {
    return (
        <Wcp.CanUseWorkflows>
            <SecurityPermissions />
            <ContentReviews />
        </Wcp.CanUseWorkflows>
    );
};

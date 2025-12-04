import React from "react";
import { plugins } from "@webiny/plugins";
import { workflowsPermissions } from "~/Components/WorkflowsPermissions/index.js";
import { ContentReviews } from "./ContentReviews.js";

/**
 * Should be registered in app-serverless-cms.
 */
export const WorkflowsAdminApp = () => {
    plugins.register([workflowsPermissions]);

    return (
        <>
            <ContentReviews />
        </>
    );
};

import React from "react";
import type { IWorkflowsAdminViewProps } from "./WorkflowsAdminView.js";
import { WorkflowsAdminView } from "./WorkflowsAdminView.js";
import { Alert } from "@webiny/admin-ui";
import { useCanUseWorkflows } from "~/hooks/canUseWorkflows.js";

/**
 * Main component which should get used to render Workflows Admin UI.
 */
export const WorkflowsAdmin = (props: IWorkflowsAdminViewProps) => {
    const { apps, onAppClick, app } = props;

    const canUseWorkflows = useCanUseWorkflows();
    if (!canUseWorkflows) {
        return (
            <Alert type={"danger"} title={"You don't have access to Workflows."}>
                You do not have access to Workflows. Please contact your system administrator.
            </Alert>
        );
    }
    return <WorkflowsAdminView apps={apps} onAppClick={onAppClick} app={app} />;
};

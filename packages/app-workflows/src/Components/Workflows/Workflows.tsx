import React from "react";
import type { IWorkflowsViewProps } from "./WorkflowsView.js";
import { WorkflowsView } from "./WorkflowsView.js";
import { Alert } from "@webiny/admin-ui";
import { useCanUseWorkflows } from "~/hooks/canUseWorkflows.js";

/**
 * Main component which should get used to render Workflows UI.
 */
export const Workflows = (props: IWorkflowsViewProps) => {
    const { apps, onAppClick, app } = props;

    const canUseWorkflows = useCanUseWorkflows();
    if (!canUseWorkflows) {
        return (
            <Alert type={"danger"} title={"You don't have access to Workflows."}>
                You do not have access to Workflows. Please contact your system administrator.
            </Alert>
        );
    }
    return <WorkflowsView apps={apps} onAppClick={onAppClick} app={app} />;
};

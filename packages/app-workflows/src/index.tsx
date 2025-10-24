import React from "react";
import type { IWorkflowsProps as BaseIWorkflowsProps } from "./Components/Workflow/index.js";
import { Workflows as BaseWorkflows } from "./Components/Workflow/index.js";
import { useWcp } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";

export * from "./Components/WorkflowState/index.js";
export type { IWorkflowApplication } from "~/types.js";

export const useCanUseWorkflows = () => {
    const wcp = useWcp();

    const canUseWorkflows = wcp.canUseWorkflows();

    return {
        canUseWorkflows
    };
};

export interface IWorkflowProps extends BaseIWorkflowsProps {
    app: string | null | undefined;
    onAppClick: (id: string) => void;
}

export const Workflows = (props: IWorkflowProps) => {
    const { apps, onAppClick, app } = props;

    const canUseWorkflows = useCanUseWorkflows();
    if (!canUseWorkflows) {
        return (
            <Alert type={"danger"} title={"You don't have access to Workflows."}>
                You do not have access to Workflows. Please contact your system administrator.
            </Alert>
        );
    }
    return <BaseWorkflows apps={apps} onAppClick={onAppClick} app={app} />;
};

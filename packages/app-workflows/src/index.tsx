import React from "react";
import type { IWorkflowsProps as BaseIWorkflowsProps } from "./Components/Workflow/index.js";
import { Workflows as BaseWorkflows } from "./Components/Workflow/index.js";
import { useWcp } from "@webiny/app-admin";

export * from "./Components/WorkflowStateBar/index.js";

export type { IWorkflowApplication } from "~/types.js";

export const useCanUseWorkflows = () => {
    const wcp = useWcp();

    const canUseWorkflows = wcp.canUseWorkflows();

    return {
        canUseWorkflows
    };
};

export interface IWorkflowProps extends BaseIWorkflowsProps {
    /**
     * Children will be rendered if the user doesn't have access to Workflows.
     */
    app: string | null | undefined;
    children?: React.ReactNode;
    onAppClick: (id: string) => void;
}

export const Workflows = (props: IWorkflowProps) => {
    const { apps, children, onAppClick, app } = props;

    const canUseWorkflows = useCanUseWorkflows();
    if (!canUseWorkflows) {
        return <>{children}</>;
    }
    return <BaseWorkflows apps={apps} onAppClick={onAppClick} app={app} />;
};

import React from "react";
import type { IWorkflowPresenterProps as BaseIWorkflowPresenterProps } from "./Components/WorkflowPresenter.js";
import { WorkflowPresenter as BaseWorkflowPresenter } from "./Components/WorkflowPresenter.js";
import { useWcp } from "@webiny/app-admin";

export const useCanUseWorkflows = () => {
    const wcp = useWcp();

    return wcp.canUseWorkflows();
};

export interface IWorkflowPresenterProps extends BaseIWorkflowPresenterProps {
    /**
     * Children will be rendered if the user doesn't have access to Workflows.
     */
    children?: React.ReactNode;
}

export const WorkflowPresenter = (props: IWorkflowPresenterProps) => {
    const { app, children } = props;

    const canUseWorkflows = useCanUseWorkflows();
    if (!canUseWorkflows) {
        return <>{children}</>;
    }
    return <BaseWorkflowPresenter app={app} />;
};

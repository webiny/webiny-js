import React from "react";
import { useWorkflowState } from "../useWorkflowState.js";
import { observer } from "mobx-react-lite";
import type { IWorkflowState } from "~/types.js";

interface IWorkflowStateOverlayPropsChildrenProps {
    state: IWorkflowState | undefined;
}

interface IWorkflowStateOverlayPropsChildren {
    (props: IWorkflowStateOverlayPropsChildrenProps): React.ReactNode;
}

interface IWorkflowStateOverlayProps {
    children: React.ReactNode | IWorkflowStateOverlayPropsChildren;
}

export const WorkflowStateOverlay = observer(({ children }: IWorkflowStateOverlayProps) => {
    const { presenter } = useWorkflowState();
    if (typeof children === "function") {
        return children({ state: presenter.vm.state || undefined });
    }
    return children;
});

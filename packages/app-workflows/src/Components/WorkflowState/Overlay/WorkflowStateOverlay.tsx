import React from "react";
import { useWorkflowState } from "../useWorkflowState.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStateOverlayProps {
    children: React.ReactNode;
}

export const WorkflowStateOverlay = observer(({ children }: IWorkflowStateOverlayProps) => {
    const { presenter } = useWorkflowState();
    if (!presenter.vm.state) {
        return children;
    }

    return (
        <div>
            <div />
            {children}
        </div>
    );
});

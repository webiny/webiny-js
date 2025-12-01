import React from "react";
import { TakeOverSuccessDialog as BaseTakeOverSuccessDialog } from "~/Components/WorkflowStateDialogs/index.js";
import type { IWorkflowState } from "~/types.js";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/hooks/useWorkflowStatesWidget.js";

interface ITakeOverSuccessDialogProps {
    state: IWorkflowState;
}

export const TakeOverSuccessDialog = (props: ITakeOverSuccessDialogProps) => {
    const { state } = props;
    const { presenter } = useWorkflowStatesWidget();
    return (
        <BaseTakeOverSuccessDialog hide={presenter.hideDialog} title={state.currentStep.title} />
    );
};

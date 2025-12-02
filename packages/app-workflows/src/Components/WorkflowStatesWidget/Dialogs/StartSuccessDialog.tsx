import React from "react";
import { StartSuccessDialog as BaseStartSuccessDialog } from "~/Components/WorkflowStateDialogs/index.js";
import type { IWorkflowState } from "~/types.js";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/hooks/useWorkflowStatesWidget.js";

interface IStartSuccessDialogProps {
    state: IWorkflowState;
}

export const StartSuccessDialog = (props: IStartSuccessDialogProps) => {
    const { state } = props;
    const { presenter } = useWorkflowStatesWidget();
    return <BaseStartSuccessDialog hide={presenter.hideDialog} title={state.currentStep.title} />;
};

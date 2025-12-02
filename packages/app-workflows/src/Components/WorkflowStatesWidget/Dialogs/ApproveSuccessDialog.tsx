import React from "react";
import { ApproveSuccessDialog as BaseApproveSuccessDialog } from "~/Components/WorkflowStateDialogs/index.js";
import type { IWorkflowState } from "~/types.js";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/hooks/useWorkflowStatesWidget.js";

interface IApproveSuccessDialogProps {
    state: IWorkflowState;
}

export const ApproveSuccessDialog = (props: IApproveSuccessDialogProps) => {
    const { state } = props;
    const { presenter } = useWorkflowStatesWidget();
    return <BaseApproveSuccessDialog hide={presenter.hideDialog} title={state.currentStep.title} />;
};

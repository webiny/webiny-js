import React from "react";
import { RejectSuccessDialog as BaseRejectSuccessDialog } from "~/Components/WorkflowStateDialogs/index.js";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/Provider/useWorkflowStatesWidget.js";
import type { IWorkflowState } from "~/types.js";

interface IRejectSuccessDialogProps {
    state: IWorkflowState;
}

export const RejectSuccessDialog = (props: IRejectSuccessDialogProps) => {
    const { state } = props;
    const { presenter } = useWorkflowStatesWidget();

    return <BaseRejectSuccessDialog hide={presenter.hideDialog} title={state.currentStep.title} />;
};

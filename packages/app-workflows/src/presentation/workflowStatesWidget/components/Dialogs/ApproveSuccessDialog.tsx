import React from "react";
import { ApproveSuccessDialog as BaseApproveSuccessDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowState } from "~/types.js";
import { useWorkflowStatesWidgetPresenter } from "~/presentation/workflowStatesWidget/useWorkflowStatesWidgetPresenter.js";

interface IApproveSuccessDialogProps {
    state: IWorkflowState;
}

export const ApproveSuccessDialog = (props: IApproveSuccessDialogProps) => {
    const { state } = props;
    const presenter = useWorkflowStatesWidgetPresenter();
    return <BaseApproveSuccessDialog hide={presenter.hideDialog} title={state.currentStep.title} />;
};

import React from "react";
import { RejectSuccessDialog as BaseRejectSuccessDialog } from "~/presentation/shared/dialogs/index.js";
import { useWorkflowStatesWidgetPresenter } from "~/presentation/workflowStatesWidget/useWorkflowStatesWidgetPresenter.js";
import type { IWorkflowState } from "~/types.js";

interface IRejectSuccessDialogProps {
    state: IWorkflowState;
}

export const RejectSuccessDialog = (props: IRejectSuccessDialogProps) => {
    const { state } = props;
    const presenter = useWorkflowStatesWidgetPresenter();

    return <BaseRejectSuccessDialog hide={presenter.hideDialog} title={state.currentStep.title} />;
};

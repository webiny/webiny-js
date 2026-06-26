import React from "react";
import { StartSuccessDialog as BaseStartSuccessDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowState } from "~/types.js";
import { useWorkflowStatesWidgetPresenter } from "~/presentation/workflowStatesWidget/useWorkflowStatesWidgetPresenter.js";

interface IStartSuccessDialogProps {
    state: IWorkflowState;
}

export const StartSuccessDialog = (props: IStartSuccessDialogProps) => {
    const { state } = props;
    const presenter = useWorkflowStatesWidgetPresenter();
    return <BaseStartSuccessDialog hide={presenter.hideDialog} title={state.currentStep.title} />;
};

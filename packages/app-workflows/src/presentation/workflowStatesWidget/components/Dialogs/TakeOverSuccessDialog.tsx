import React from "react";
import { TakeOverSuccessDialog as BaseTakeOverSuccessDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowState } from "~/types.js";
import { useWorkflowStatesWidgetPresenter } from "~/presentation/workflowStatesWidget/useWorkflowStatesWidgetPresenter.js";

interface ITakeOverSuccessDialogProps {
    state: IWorkflowState;
}

export const TakeOverSuccessDialog = (props: ITakeOverSuccessDialogProps) => {
    const { state } = props;
    const presenter = useWorkflowStatesWidgetPresenter();
    return (
        <BaseTakeOverSuccessDialog hide={presenter.hideDialog} title={state.currentStep.title} />
    );
};

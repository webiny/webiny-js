import React, { useCallback } from "react";
import { TakeOverDialog as BaseTakeOverDialog } from "~/presentation/shared/dialogs/index.js";
import { useWorkflowStatesWidgetPresenter } from "~/presentation/workflowStatesWidget/useWorkflowStatesWidgetPresenter.js";
import type { IWorkflowState } from "~/types.js";

interface ITakeOverDialogProps {
    state: IWorkflowState;
}

export const TakeOverDialog = (props: ITakeOverDialogProps) => {
    const { state } = props;
    const presenter = useWorkflowStatesWidgetPresenter();

    const onTakeOver = useCallback(() => {
        presenter.takeOverStateStep(state);
    }, [state.id]);

    const step = state.currentStep;

    if (!step.canTakeOver) {
        return null;
    }
    const displayName = step.savedBy?.displayName || "Unknown User";

    return (
        <BaseTakeOverDialog
            onTakeOver={onTakeOver}
            hide={presenter.hideDialog}
            loading={presenter.vm.actionLoading}
            title={state.currentStep.title}
            displayName={displayName}
        />
    );
};

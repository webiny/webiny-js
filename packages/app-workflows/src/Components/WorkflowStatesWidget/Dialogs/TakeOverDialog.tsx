import React, { useCallback } from "react";
import { TakeOverDialog as BaseTakeOverDialog } from "~/Components/WorkflowStateDialogs/index.js";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/hooks/useWorkflowStatesWidget.js";
import type { IWorkflowState } from "~/types.js";

interface ITakeOverDialogProps {
    state: IWorkflowState;
}

export const TakeOverDialog = (props: ITakeOverDialogProps) => {
    const { state } = props;
    const { presenter } = useWorkflowStatesWidget();

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
            loading={presenter.vm.dialogLoading}
            title={state.currentStep.title}
            displayName={displayName}
        />
    );
};

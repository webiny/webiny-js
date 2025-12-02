import React, { useCallback } from "react";
import { StartDialog as BaseStartDialog } from "~/Components/WorkflowStateDialogs/index.js";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/hooks/useWorkflowStatesWidget.js";
import type { IWorkflowState } from "~/types.js";

interface IStartDialogProps {
    state: IWorkflowState;
}

export const StartDialog = (props: IStartDialogProps) => {
    const { state } = props;
    const { presenter } = useWorkflowStatesWidget();

    const onStart = useCallback(() => {
        presenter.startStateStep(state);
    }, [state.id]);

    if (!state.currentStep.canReview) {
        return null;
    }

    return (
        <BaseStartDialog
            onStart={onStart}
            hide={presenter.hideDialog}
            loading={presenter.vm.dialogLoading}
            title={state.currentStep.title}
        />
    );
};

import React, { useCallback } from "react";
import { StartDialog as BaseStartDialog } from "~/presentation/shared/dialogs/index.js";
import { useWorkflowStatesWidgetPresenter } from "~/presentation/workflowStatesWidget/useWorkflowStatesWidgetPresenter.js";
import type { IWorkflowState } from "~/types.js";

interface IStartDialogProps {
    state: IWorkflowState;
}

export const StartDialog = (props: IStartDialogProps) => {
    const { state } = props;
    const presenter = useWorkflowStatesWidgetPresenter();

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
            loading={presenter.vm.actionLoading}
            title={state.currentStep.title}
        />
    );
};

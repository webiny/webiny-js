import React, { useCallback } from "react";
import { RejectDialog as BaseRejectDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowState } from "~/types.js";
import { useWorkflowStatesWidgetPresenter } from "~/presentation/workflowStatesWidget/useWorkflowStatesWidgetPresenter.js";

interface IRejectDialogProps {
    state: IWorkflowState;
}

export const RejectDialog = (props: IRejectDialogProps) => {
    const { state } = props;
    const presenter = useWorkflowStatesWidgetPresenter();

    const onReject = useCallback(
        (comment: string) => {
            presenter.rejectStateStep(state, comment);
        },
        [state.id]
    );

    if (!state.currentStep.canReview) {
        return null;
    }

    return (
        <BaseRejectDialog
            onReject={onReject}
            hide={presenter.hideDialog}
            loading={presenter.vm.actionLoading}
            title={state.currentStep.title}
        />
    );
};

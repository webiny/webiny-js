import React, { useCallback } from "react";
import { ApproveDialog as BaseApproveDialog } from "~/presentation/shared/dialogs/index.js";
import { useWorkflowStatesWidgetPresenter } from "~/presentation/workflowStatesWidget/useWorkflowStatesWidgetPresenter.js";
import type { IWorkflowState } from "~/types.js";

interface IApproveDialogProps {
    state: IWorkflowState;
}

export const ApproveDialog = (props: IApproveDialogProps) => {
    const { state } = props;
    const presenter = useWorkflowStatesWidgetPresenter();

    const onApprove = useCallback(
        (comment?: string) => {
            presenter.approveStateStep(state, comment);
        },
        [state.id]
    );

    if (!state.currentStep.canReview) {
        return null;
    }

    return (
        <BaseApproveDialog
            onApprove={onApprove}
            hide={presenter.hideDialog}
            loading={presenter.vm.actionLoading}
            title={state.currentStep.title}
        />
    );
};

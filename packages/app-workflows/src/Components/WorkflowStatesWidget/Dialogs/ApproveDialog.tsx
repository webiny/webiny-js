import React, { useCallback } from "react";
import { ApproveDialog as BaseApproveDialog } from "~/Components/WorkflowStateDialogs/index.js";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/hooks/useWorkflowStatesWidget.js";
import type { IWorkflowState } from "~/types.js";

interface IApproveDialogProps {
    state: IWorkflowState;
}

export const ApproveDialog = (props: IApproveDialogProps) => {
    const { state } = props;
    const { presenter } = useWorkflowStatesWidget();

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
            loading={presenter.vm.dialogLoading}
            title={state.currentStep.title}
        />
    );
};

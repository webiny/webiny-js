import React, { useCallback } from "react";
import { RejectDialog as BaseRejectDialog } from "~/Components/WorkflowStateDialogs/index.js";
import type { IWorkflowState } from "~/types.js";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/Provider/useWorkflowStatesWidget.js";

interface IRejectDialogProps {
    state: IWorkflowState;
}

export const RejectDialog = (props: IRejectDialogProps) => {
    const { state } = props;
    const { presenter } = useWorkflowStatesWidget();

    const onReject = useCallback(
        (comment: string) => {
            presenter.approveStateStep(state, comment);
        },
        [state.id]
    );

    if (!state.currentStep.isAllowedToReview) {
        return null;
    }

    return (
        <BaseRejectDialog
            onReject={onReject}
            hide={presenter.hideDialog}
            loading={presenter.vm.dialogLoading}
            title={state.currentStep.title}
        />
    );
};

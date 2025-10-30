import React from "react";
import { ApproveDialog as BaseApproveDialog } from "~/Components/WorkflowStateDialogs/index.js";
import { useWorkflowStatesWidget } from "~/Components/WorkflowStatesWidget/Provider/useWorkflowStatesWidget.js";

export const ApproveDialog = (props: IApproveDialogProps) => {
    const { presenter } = useWorkflowStatesWidget();

    const step = presenter.vm.step;
    if (!step) {
        return null;
    }

    return (
        <BaseApproveDialog
            onApprove={presenter.approve}
            hide={presenter.hideDialog}
            loading={presenter.vm.loading}
            title={step.title}
        />
    );
};

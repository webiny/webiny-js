import React from "react";
import { ApproveDialog as BaseApproveDialog } from "~/Components/WorkflowStateDialogs/index.js";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";

interface IApproveDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const ApproveDialog = (props: IApproveDialogProps) => {
    const { presenter } = props;
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

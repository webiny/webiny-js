import React from "react";
import { ApproveSuccessDialog as BaseApproveSuccessDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";

interface IApproveSuccessDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const ApproveSuccessDialog = (props: IApproveSuccessDialogProps) => {
    const { presenter } = props;

    const step = presenter.vm.step;

    if (!step) {
        return null;
    }

    return <BaseApproveSuccessDialog hide={presenter.hideDialog} title={step.title} />;
};

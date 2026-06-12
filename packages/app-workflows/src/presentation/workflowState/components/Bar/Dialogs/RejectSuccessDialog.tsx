import React from "react";
import { RejectSuccessDialog as BaseRejectSuccessDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";

interface IRejectSuccessDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const RejectSuccessDialog = (props: IRejectSuccessDialogProps) => {
    const { presenter } = props;

    const step = presenter.vm.step;

    if (!step) {
        return null;
    }

    return <BaseRejectSuccessDialog hide={presenter.hideDialog} title={step.title} />;
};

import React from "react";
import { RejectSuccessDialog as BaseRejectSuccessDialog } from "~/Components/WorkflowStateDialogs/index.js";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";

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

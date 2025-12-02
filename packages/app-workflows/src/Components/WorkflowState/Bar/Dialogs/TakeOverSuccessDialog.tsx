import React from "react";
import { TakeOverSuccessDialog as BaseTakeOverSuccessDialog } from "~/Components/WorkflowStateDialogs/index.js";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";

interface ITakeOverSuccessDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const TakeOverSuccessDialog = (props: ITakeOverSuccessDialogProps) => {
    const { presenter } = props;

    const step = presenter.vm.step;

    if (!step) {
        return null;
    }

    return <BaseTakeOverSuccessDialog hide={presenter.hideDialog} title={step.title} />;
};

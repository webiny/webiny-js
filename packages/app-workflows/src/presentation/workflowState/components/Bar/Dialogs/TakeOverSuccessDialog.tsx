import React from "react";
import { TakeOverSuccessDialog as BaseTakeOverSuccessDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";

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

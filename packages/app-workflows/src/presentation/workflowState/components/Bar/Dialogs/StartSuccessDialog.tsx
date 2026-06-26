import React from "react";
import { StartSuccessDialog as BaseStartSuccessDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";

interface IStartSuccessDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const StartSuccessDialog = (props: IStartSuccessDialogProps) => {
    const { presenter } = props;

    const step = presenter.vm.step;

    if (!step) {
        return null;
    }

    return <BaseStartSuccessDialog hide={presenter.hideDialog} title={step.title} />;
};

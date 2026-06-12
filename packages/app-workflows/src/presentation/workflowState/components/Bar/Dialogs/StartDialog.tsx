import React from "react";
import { StartDialog as BaseStartDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";

interface IStartDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const StartDialog = (props: IStartDialogProps) => {
    const { presenter } = props;
    const step = presenter.vm.step;
    if (!step) {
        return null;
    }

    return (
        <BaseStartDialog
            onStart={presenter.start}
            hide={presenter.hideDialog}
            loading={presenter.vm.loading}
            title={step.title}
        />
    );
};

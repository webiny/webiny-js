import React from "react";
import { RejectDialog as BaseRejectDialog } from "~/Components/WorkflowStateDialogs/index.js";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";

interface IRejectDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const RejectDialog = (props: IRejectDialogProps) => {
    const { presenter } = props;
    const step = presenter.vm.step;
    if (!step) {
        return null;
    }

    return (
        <BaseRejectDialog
            onReject={presenter.reject}
            hide={presenter.hideDialog}
            loading={presenter.vm.loading}
            title={step.title}
        />
    );
};

import React from "react";
import { observer } from "mobx-react-lite";
import { RejectDialog as BaseRejectDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";

interface IRejectDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const RejectDialog = observer((props: IRejectDialogProps) => {
    const { presenter } = props;
    const step = presenter.vm.step;
    if (!step) {
        return null;
    }

    return (
        <BaseRejectDialog
            onReject={presenter.reject}
            hide={presenter.hideDialog}
            loading={presenter.vm.executing}
            title={step.title}
        />
    );
});

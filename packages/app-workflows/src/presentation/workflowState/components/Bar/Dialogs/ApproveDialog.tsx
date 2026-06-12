import React from "react";
import { observer } from "mobx-react-lite";
import { ApproveDialog as BaseApproveDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";

interface IApproveDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const ApproveDialog = observer((props: IApproveDialogProps) => {
    const { presenter } = props;
    const step = presenter.vm.step;
    if (!step) {
        return null;
    }

    return (
        <BaseApproveDialog
            onApprove={presenter.approve}
            hide={presenter.hideDialog}
            loading={presenter.vm.executing}
            title={step.title}
        />
    );
});

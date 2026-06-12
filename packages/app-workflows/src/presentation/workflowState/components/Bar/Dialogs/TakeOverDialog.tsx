import React from "react";
import { TakeOverDialog as BaseTakeOverDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";

interface ITakeOverDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const TakeOverDialog = (props: ITakeOverDialogProps) => {
    const { presenter } = props;
    const step = presenter.vm.step;
    if (!step) {
        return null;
    }

    const displayName = step.savedBy?.displayName || "unknown: " + step.savedBy?.id || "N/A";

    return (
        <BaseTakeOverDialog
            onTakeOver={presenter.takeOver}
            hide={presenter.hideDialog}
            loading={presenter.vm.loading}
            title={step.title}
            displayName={displayName}
        />
    );
};

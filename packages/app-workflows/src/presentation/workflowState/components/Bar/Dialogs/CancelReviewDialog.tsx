import React from "react";
import { observer } from "mobx-react-lite";
import { CancelReviewDialog as BaseCancelReviewDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";

interface ICancelReviewDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const CancelReviewDialog = observer((props: ICancelReviewDialogProps) => {
    const { presenter } = props;

    return (
        <BaseCancelReviewDialog
            onCancelReview={presenter.cancel}
            hide={presenter.hideDialog}
            loading={presenter.vm.executing}
        />
    );
});

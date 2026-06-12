import React from "react";
import { CancelReviewDialog as BaseCancelReviewDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";

interface ICancelReviewDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const CancelReviewDialog = (props: ICancelReviewDialogProps) => {
    const { presenter } = props;

    return (
        <BaseCancelReviewDialog
            onCancelReview={presenter.cancel}
            hide={presenter.hideDialog}
            loading={presenter.vm.loading}
        />
    );
};

import React from "react";
import { RequestReviewDialog as BaseRequestReviewDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";

interface IRequestReviewDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const RequestReviewDialog = (props: IRequestReviewDialogProps) => {
    const { presenter } = props;

    return (
        <BaseRequestReviewDialog
            onRequestReview={presenter.requestReview}
            hide={presenter.hideDialog}
            loading={presenter.vm.loading}
        />
    );
};

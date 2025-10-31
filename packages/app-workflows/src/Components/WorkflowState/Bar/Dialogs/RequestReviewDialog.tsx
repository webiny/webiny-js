import React from "react";
import { RequestReviewDialog as BaseRequestReviewDialog } from "~/Components/WorkflowStateDialogs/index.js";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";

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

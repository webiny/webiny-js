import React from "react";
import { CommentDialog as BaseCommentDialog } from "~/Components/WorkflowStateDialogs/index.js";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";

interface ICommentDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const CommentDialog = (props: ICommentDialogProps) => {
    const { presenter } = props;

    const step = presenter.vm.step;

    if (!step) {
        return null;
    }

    return <BaseCommentDialog step={step} hide={presenter.hideDialog} />;
};

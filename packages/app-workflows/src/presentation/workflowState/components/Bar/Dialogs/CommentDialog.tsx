import React from "react";
import { CommentDialog as BaseCommentDialog } from "~/presentation/shared/dialogs/index.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";

interface ICommentDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const CommentDialog = (props: ICommentDialogProps) => {
    const { presenter } = props;

    const step = presenter.vm.dialog?.step;

    if (!step) {
        return null;
    }

    return <BaseCommentDialog step={step} hide={presenter.hideDialog} />;
};

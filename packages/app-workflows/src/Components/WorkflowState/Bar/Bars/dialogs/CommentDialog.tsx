import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import type { IWorkflowStateStepModel } from "~/Models/index.js";
import { Dialog, Grid } from "@webiny/admin-ui";
import React from "react";
import { WorkflowStateValue } from "~/types.js";
import { ReactComponent as RejectIcon } from "@webiny/icons/do_not_disturb.svg";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";

interface ICommentDialogProps {
    presenter: IWorkflowStatePresenter;
    step: IWorkflowStateStepModel;
}

interface ITitleProps {
    step: IWorkflowStateStepModel;
}

const Title = (props: ITitleProps) => {
    const { step } = props;
    if (step.state === WorkflowStateValue.rejected) {
        return (
            <>
                <RejectIcon className={"fill-destructive"} />
                {step.title} Rejected!
            </>
        );
    }
    return (
        <>
            <ApproveIcon className={"fill-success"} />
            {step.title} Approved!
        </>
    );
};

export const CommentDialog = (props: ICommentDialogProps) => {
    const { presenter, step } = props;
    return (
        <Dialog
            open={true}
            onOpenChange={presenter.hideDialog}
            title={<Title step={step} />}
            actions={
                <>
                    <Dialog.ConfirmButton text={"Close"} onClick={presenter.hideDialog} />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            <Grid>
                <Grid.Column span={12}>{step.comment || "No comment provided."}</Grid.Column>
            </Grid>
        </Dialog>
    );
};

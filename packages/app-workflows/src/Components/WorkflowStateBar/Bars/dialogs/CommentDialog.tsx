import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import type { IWorkflowStateStepModel } from "~/Models/index.js";
import { Dialog, Grid } from "@webiny/admin-ui";
import React from "react";
import { WorkflowStateValue } from "~/types.js";

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
        return <>{step.title} Rejected</>;
    }
    return <>{step.title} Approved</>;
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

import type { IWorkflowStateStepModel } from "~/Models/index.js";
import { Dialog, Grid, Icon } from "@webiny/admin-ui";
import React from "react";
import { WorkflowStateValue } from "~/types.js";
import { ReactComponent as RejectIcon } from "@webiny/icons/do_not_disturb.svg";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";

interface ICommentDialogProps {
    hide(): void;
    step: Pick<IWorkflowStateStepModel, "state" | "title" | "comment">;
}

interface ITitleProps {
    step: Pick<IWorkflowStateStepModel, "state" | "title">;
}

const Title = (props: ITitleProps) => {
    const { step } = props;
    if (step.state === WorkflowStateValue.rejected) {
        return (
            <>
                <Icon
                    label={`${step.title} Rejected!`}
                    size={"md"}
                    className={"fill-destructive"}
                    icon={<RejectIcon />}
                />
                {step.title} Rejected!
            </>
        );
    }
    return (
        <>
            <Icon
                label={`${step.title} Approved!`}
                size={"md"}
                className={"fill-success"}
                icon={<ApproveIcon />}
            />
            {step.title} Approved!
        </>
    );
};

export const CommentDialog = (props: ICommentDialogProps) => {
    const { hide, step } = props;
    return (
        <Dialog
            open={true}
            onOpenChange={hide}
            title={<Title step={step} />}
            actions={
                <>
                    <Dialog.ConfirmAction text={"Close"} onClick={hide} />
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

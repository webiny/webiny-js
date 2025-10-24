import React from "react";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { Dialog, Grid } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";

interface IApproveSuccessDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const ApproveSuccessDialog = (props: IApproveSuccessDialogProps) => {
    const { presenter } = props;

    const step = presenter.vm.lastApprovedStep;
    if (!step) {
        return null;
    }

    return (
        <Dialog
            open={true}
            onOpenChange={presenter.hideDialog}
            title={
                <>
                    <ApproveIcon className={"wby-fill-success"} />
                    {step.title} Approved
                </>
            }
            actions={
                <>
                    <Dialog.ConfirmButton text={"Close"} onClick={presenter.hideDialog} />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            <Grid>
                <Grid.Column span={12}>
                    <strong>{step.title}</strong> is successfully approved. All relevant parties
                    have been notified.
                </Grid.Column>
                <Grid.Column span={12}>
                    You can track all Content Reviews <u>here</u>.
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

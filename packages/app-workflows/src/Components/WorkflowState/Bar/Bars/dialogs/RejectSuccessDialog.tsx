import React from "react";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { Dialog, Grid } from "@webiny/admin-ui";
import { ReactComponent as RejectIcon } from "@webiny/icons/do_not_disturb.svg";

interface IRejectSuccessDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const RejectSuccessDialog = (props: IRejectSuccessDialogProps) => {
    const { presenter } = props;

    const step = presenter.vm.lastRejectedStep;
    if (!step) {
        return null;
    }

    return (
        <Dialog
            open={true}
            onOpenChange={presenter.hideDialog}
            title={
                <>
                    <RejectIcon className={"fill-destructive"} />
                    {step.title} Rejected
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

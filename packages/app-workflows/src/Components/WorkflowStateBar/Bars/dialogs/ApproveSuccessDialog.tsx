import React from "react";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { Dialog, Grid } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";

interface IApproveSuccessDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const ApproveSuccessDialog = (props: IApproveSuccessDialogProps) => {
    const { presenter } = props;

    return (
        <Dialog
            open={true}
            onOpenChange={presenter.hideDialog}
            title={
                <>
                    <ApproveIcon className={"wby-fill-success"} />
                    {presenter.vm.step?.title} Approved
                </>
            }
            actions={
                <>
                    <Dialog.CancelButton onClick={presenter.hideDialog} />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            <Grid>
                <Grid.Column span={12}>
                    <strong>{presenter.vm.step?.title}</strong> is successfully approved. All
                    relevant parties have been notified.
                </Grid.Column>
                <Grid.Column span={12}>
                    You can track all Content Reviews <u>here</u>.
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

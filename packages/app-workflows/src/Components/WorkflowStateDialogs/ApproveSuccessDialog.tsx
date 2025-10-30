import React from "react";
import { Dialog, Grid } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";

interface IApproveSuccessDialogProps {
    hide(): void;
    title: string;
}

export const ApproveSuccessDialog = (props: IApproveSuccessDialogProps) => {
    const { hide, title } = props;

    return (
        <Dialog
            open={true}
            onOpenChange={hide}
            title={
                <>
                    <ApproveIcon className={"fill-success"} />
                    {title} Approved
                </>
            }
            actions={
                <>
                    <Dialog.ConfirmButton text={"Close"} onClick={hide} />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            <Grid>
                <Grid.Column span={12}>
                    <strong>{title}</strong> is successfully approved. All relevant parties have
                    been notified.
                </Grid.Column>
                <Grid.Column span={12}>
                    You can track all Content Reviews <u>here</u>.
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

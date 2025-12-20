import React from "react";
import { Dialog, Grid } from "@webiny/admin-ui";
import { ReactComponent as RejectIcon } from "@webiny/icons/do_not_disturb.svg";
import { YouCanTrackAllContentReviewsHere } from "~/Components/Common/index.js";

interface IRejectSuccessDialogProps {
    hide: () => void;
    title: string;
}

export const RejectSuccessDialog = (props: IRejectSuccessDialogProps) => {
    const { hide, title } = props;

    return (
        <Dialog
            open={true}
            onOpenChange={hide}
            title={
                <>
                    <RejectIcon className={"fill-destructive"} />
                    {title} Rejected
                </>
            }
            actions={
                <>
                    <Dialog.ConfirmAction text={"Close"} onClick={hide} />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            <Grid>
                <Grid.Column span={12}>
                    <strong>{title}</strong> is successfully rejected. All relevant parties have
                    been notified.
                </Grid.Column>
                <Grid.Column span={12}>
                    <YouCanTrackAllContentReviewsHere />
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

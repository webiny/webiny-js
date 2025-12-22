import React from "react";
import { Dialog, Grid, Icon } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";
import { YouCanTrackAllContentReviewsHere } from "~/Components/Common/index.js";

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
                    <Icon
                        label={"Approved"}
                        size={"md"}
                        className={"fill-success"}
                        icon={<ApproveIcon className={"fill-success"} />}
                    />
                    {title} Approved
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
                    <strong>{title}</strong> is successfully approved. All relevant parties have
                    been notified.
                </Grid.Column>
                <Grid.Column span={12}>
                    <YouCanTrackAllContentReviewsHere />
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

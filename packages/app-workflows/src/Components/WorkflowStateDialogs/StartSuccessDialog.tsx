import React from "react";
import { Dialog, Grid } from "@webiny/admin-ui";
import { ReactComponent as StartIcon } from "@webiny/icons/check.svg";
import { YouCanTrackAllContentReviewsHere } from "~/Components/Common/index.js";

interface IStartSuccessDialogProps {
    hide(): void;
    title: string;
}

export const StartSuccessDialog = (props: IStartSuccessDialogProps) => {
    const { hide, title } = props;

    return (
        <Dialog
            open={true}
            onOpenChange={hide}
            title={
                <>
                    <StartIcon className={"fill-success"} />
                    <strong>{title}</strong> Content Review Started
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
                    <strong>{title}</strong> content review successfully started.
                </Grid.Column>
                <Grid.Column span={12}>
                    <YouCanTrackAllContentReviewsHere />
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

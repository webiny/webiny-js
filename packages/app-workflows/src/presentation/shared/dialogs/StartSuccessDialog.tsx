import React from "react";
import { Dialog, Grid, Icon } from "@webiny/admin-ui";
import { ReactComponent as StartIcon } from "@webiny/icons/check.svg";
import { YouCanTrackAllContentReviewsHere } from "~/presentation/shared/index.js";

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
                    <Icon
                        label={"Content Review Started"}
                        size={"md"}
                        className={"fill-success"}
                        icon={<StartIcon />}
                    />
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

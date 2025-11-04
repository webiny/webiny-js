import React from "react";
import { Dialog, Grid } from "@webiny/admin-ui";
import { ReactComponent as StartIcon } from "@webiny/icons/check.svg";

interface ITakeOverSuccessDialogProps {
    hide(): void;
    title: string;
}

export const TakeOverSuccessDialog = (props: ITakeOverSuccessDialogProps) => {
    const { hide, title } = props;

    return (
        <Dialog
            open={true}
            onOpenChange={hide}
            title={
                <>
                    <StartIcon className={"fill-success"} />
                    <strong>{title}</strong> Content Review Taken Over
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
                    <strong>{title}</strong> content review successfully taken over.
                </Grid.Column>
                <Grid.Column span={12}>
                    You can track all Content Reviews <u>here</u>.
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

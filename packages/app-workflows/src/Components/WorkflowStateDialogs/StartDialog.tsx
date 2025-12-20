import React from "react";
import { Dialog, Grid, OverlayLoader } from "@webiny/admin-ui";
import { ReactComponent as StartIcon } from "@webiny/icons/check.svg";

interface IStartDialogProps {
    onStart(): void;
    hide(): void;
    loading: boolean;
    title: string;
}

export const StartDialog = (props: IStartDialogProps) => {
    const { onStart, hide, loading, title } = props;

    return (
        <Dialog
            open={true}
            onOpenChange={hide}
            title={
                <>
                    <StartIcon className={"fill-success"} />
                    Start Content Review?
                </>
            }
            actions={
                <>
                    <Dialog.CancelAction onClick={hide} />
                    <Dialog.ConfirmAction text={"Start Content Review"} onClick={onStart} />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            {loading ? <OverlayLoader size="sm" variant="accent" indeterminate={true} /> : null}
            <Grid>
                <Grid.Column span={12}>
                    You are about to start the review of <strong>{title}</strong>.
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

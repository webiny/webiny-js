import React from "react";
import { Dialog, Grid, Icon } from "@webiny/admin-ui";
import { ReactComponent as StartIcon } from "@webiny/icons/check.svg";
import { OverlayLoader } from "@webiny/admin-ui";

interface ITakeOverProps {
    onTakeOver(): void;
    hide(): void;
    loading: boolean;
    title: string;
    displayName: string;
}

export const TakeOverDialog = (props: ITakeOverProps) => {
    const { onTakeOver, hide, loading, title, displayName } = props;

    return (
        <Dialog
            open={true}
            overlay={loading ? <OverlayLoader size="md" /> : null}
            onOpenChange={hide}
            title={
                <>
                    <Icon
                        label={"Take Over Content Review?"}
                        size={"md"}
                        className={"fill-success"}
                        icon={<StartIcon />}
                    />
                    Take Over Content Review?
                </>
            }
            actions={
                <>
                    <Dialog.CancelAction onClick={hide} />
                    <Dialog.ConfirmAction text={"Take Over Content Review"} onClick={onTakeOver} />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            <Grid>
                <Grid.Column span={12}>
                    You are about to take over the review of <strong>{title}</strong>. Current owner
                    is {displayName}.
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

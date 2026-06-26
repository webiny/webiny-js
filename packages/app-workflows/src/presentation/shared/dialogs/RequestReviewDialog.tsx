import React from "react";
import { Dialog, Grid, Icon, OverlayLoader } from "@webiny/admin-ui";
import { ReactComponent as RequestReviewIcon } from "@webiny/icons/check.svg";

interface IRequestReviewDialogProps {
    onRequestReview(): void;
    hide(): void;
    loading: boolean;
}

export const RequestReviewDialog = (props: IRequestReviewDialogProps) => {
    const { onRequestReview, hide, loading } = props;

    return (
        <Dialog
            open={true}
            overlay={loading ? <OverlayLoader size="md" /> : null}
            onOpenChange={hide}
            title={
                <>
                    <Icon
                        label={"Request Content Review?"}
                        size={"md"}
                        className={"fill-success"}
                        icon={<RequestReviewIcon />}
                    />
                    Request Content Review?
                </>
            }
            actions={
                <>
                    <Dialog.CancelAction onClick={hide} />
                    <Dialog.ConfirmAction
                        text={"Request Content Review"}
                        onClick={onRequestReview}
                    />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            <Grid>
                <Grid.Column span={12}>
                    You are about to request the content review. Once requested, the entry will be
                    locked for further editing.
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

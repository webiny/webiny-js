import React from "react";
import { Dialog, Grid, OverlayLoader } from "@webiny/admin-ui";
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
            onOpenChange={hide}
            title={
                <>
                    <RequestReviewIcon className={"fill-success"} />
                    Request Content Review?
                </>
            }
            actions={
                <>
                    <Dialog.CancelButton onClick={hide} />
                    <Dialog.ConfirmButton
                        text={"Request Content Review"}
                        onClick={onRequestReview}
                    />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            {loading ? <OverlayLoader size="sm" variant="accent" indeterminate={true} /> : null}
            <Grid>
                <Grid.Column span={12}>
                    You are about to request the content review. Once requested, the entry will be
                    locked for further editing.
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

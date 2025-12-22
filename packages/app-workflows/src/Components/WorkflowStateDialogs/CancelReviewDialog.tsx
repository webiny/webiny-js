import React from "react";
import { Dialog, Grid, Icon, OverlayLoader } from "@webiny/admin-ui";
import { ReactComponent as CancelReviewIcon } from "@webiny/icons/check.svg";

interface ICancelReviewDialogProps {
    onCancelReview(): void;
    hide(): void;
    loading: boolean;
}

export const CancelReviewDialog = (props: ICancelReviewDialogProps) => {
    const { onCancelReview, hide, loading } = props;

    return (
        <Dialog
            open={true}
            onOpenChange={hide}
            title={
                <>
                    <Icon
                        label={"Cancel Content Review?"}
                        size={"md"}
                        className={"fill-success"}
                        icon={<CancelReviewIcon />}
                    />
                    Cancel Content Review?
                </>
            }
            actions={
                <>
                    <Dialog.CancelAction onClick={hide} />
                    <Dialog.ConfirmAction text={"Cancel Content Review"} onClick={onCancelReview} />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            {loading ? <OverlayLoader size="sm" variant="accent" indeterminate={true} /> : null}
            <Grid>
                <Grid.Column span={12}>
                    You are about to cancel the request to for content review.
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

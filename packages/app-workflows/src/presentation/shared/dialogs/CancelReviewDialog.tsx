import React from "react";
import { Dialog, Grid, Icon } from "@webiny/admin-ui";
import { ReactComponent as CancelReviewIcon } from "@webiny/icons/check.svg";
import { OverlayLoader } from "@webiny/admin-ui";

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
            overlay={loading ? <OverlayLoader size="md" /> : null}
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
            <Grid>
                <Grid.Column span={12}>
                    You are about to cancel the request for content review.
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

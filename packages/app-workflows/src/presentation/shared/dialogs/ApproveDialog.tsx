import React, { useCallback } from "react";
import { Dialog, Grid, Icon, OverlayLoader, Textarea } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";

interface IApproveDialogProps {
    onApprove(comment?: string): void;
    hide(): void;
    loading: boolean;
    title: string;
}

export const ApproveDialog = (props: IApproveDialogProps) => {
    const { onApprove, hide, loading, title } = props;

    const [comment, setComment] = React.useState<string>("");

    const onConfirm = useCallback(() => {
        onApprove(comment);
    }, [onApprove, comment]);
    return (
        <Dialog
            open={true}
            onOpenChange={hide}
            title={
                <>
                    <Icon
                        label={"Approve Content?"}
                        size={"md"}
                        className={"fill-success"}
                        icon={<ApproveIcon />}
                    />
                    Approve Content?
                </>
            }
            actions={
                <>
                    <Dialog.CancelAction onClick={hide} />
                    <Dialog.ConfirmAction text={"Approve content"} onClick={onConfirm} />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            {loading ? <OverlayLoader size="sm" variant="accent" indeterminate={true} /> : null}
            <Grid>
                <Grid.Column span={12}>
                    You are about to approve the <strong>{title}</strong>. Authors and responsible
                    reviewers will be notified.
                </Grid.Column>
                <Grid.Column span={12}>
                    <Textarea
                        description={
                            <>
                                <strong>Add a comment</strong> (optional)
                            </>
                        }
                        required={true}
                        value={comment}
                        onChange={setComment}
                    />
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

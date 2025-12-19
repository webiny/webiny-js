import React, { useCallback, useState } from "react";
import { Dialog, Grid, OverlayLoader, Textarea } from "@webiny/admin-ui";
import { ReactComponent as RejectIcon } from "@webiny/icons/do_not_disturb.svg";

interface IRejectDialogProps {
    onReject(comment: string): void;
    hide(): void;
    title: string;
    loading: boolean;
}

const defaultMessage = "Please write a reason for rejecting the content.";

export const RejectDialog = (props: IRejectDialogProps) => {
    const { hide, title, onReject, loading } = props;

    const [comment, setComment] = useState<string>("");
    const [validation, setValidation] = useState({
        isValid: false,
        message: defaultMessage
    });

    const validate = useCallback(
        async (input?: string) => {
            const toValidate = input || comment;
            if (!toValidate.trim()) {
                setValidation({
                    isValid: false,
                    message: defaultMessage
                });
            } else if (toValidate.length < 10) {
                setValidation({
                    isValid: false,
                    message: "Comment must be at least 10 characters long."
                });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        },
        [validation, comment]
    );

    const onChange = useCallback(
        (input: string) => {
            setComment(input);
            validate(input);
        },
        [comment]
    );

    const onConfirm = useCallback(() => {
        if (!validation.isValid) {
            return;
        }
        onReject(comment);
    }, [onReject, comment]);
    return (
        <Dialog
            open={true}
            onOpenChange={hide}
            title={
                <>
                    <RejectIcon className={"fill-destructive"} />
                    Reject Content?
                </>
            }
            actions={
                <>
                    <Dialog.CancelAction onClick={hide} />
                    <Dialog.ConfirmAction
                        disabled={!validation.isValid}
                        text={"Reject content"}
                        onClick={onConfirm}
                    />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            {loading ? <OverlayLoader size="sm" variant="accent" indeterminate={true} /> : null}
            <Grid>
                <Grid.Column span={12}>
                    You are about to reject the <strong>{title}</strong>, are you sure you want to
                    do this? Author will be notified about the rejection.
                </Grid.Column>
                <Grid.Column span={12}>
                    <Textarea
                        description={
                            <>
                                <strong>Please write the reason for rejecting the content</strong>
                            </>
                        }
                        required={true}
                        value={comment}
                        onChange={onChange}
                        validate={validate}
                        validation={validation}
                    />
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

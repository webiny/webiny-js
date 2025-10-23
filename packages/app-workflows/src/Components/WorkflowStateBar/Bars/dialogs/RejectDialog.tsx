import React, { useCallback, useState } from "react";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { Dialog, Grid, Loader, Textarea } from "@webiny/admin-ui";
import { ReactComponent as RejectIcon } from "@webiny/icons/do_not_disturb.svg";

interface IRejectDialogProps {
    presenter: IWorkflowStatePresenter;
}

const defaultMessage = "Please write a reason for rejecting the content.";

export const RejectDialog = (props: IRejectDialogProps) => {
    const { presenter } = props;
    
    const [value, setValue] = useState<string>("");
    const [validation, setValidation] = useState({
        isValid: false,
        message: defaultMessage
    });

    const validate = useCallback(
        async (input?: string) => {
            const toValidate = input || value;
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
        [validation, value]
    );

    const onChange = useCallback(
        (input: string) => {
            setValue(input);
            validate(input);
        },
        [value]
    );

    const onConfirm = useCallback(() => {
        if (!validation.isValid) {
            return;
        }
        presenter.reject(value);
    }, [presenter.reject, value]);
    return (
        <Dialog
            open={true}
            onOpenChange={presenter.hideDialog}
            title={
                <>
                    <RejectIcon className={"wby-fill-destructive"} />
                    Reject Content?
                </>
            }
            actions={
                <>
                    <Dialog.CancelButton onClick={presenter.hideDialog} />
                    <Dialog.ConfirmButton
                        disabled={!validation.isValid}
                        text={"Reject content"}
                        onClick={onConfirm}
                    />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            {presenter.vm.loading ? (
                <Loader size="sm" variant="accent" indeterminate={true} />
            ) : null}
            <Grid>
                <Grid.Column span={12}>
                    You are about to reject the <strong>{presenter.vm.step?.title}</strong>, are you
                    sure you want to do this? Author will be notified about the rejection.
                </Grid.Column>
                <Grid.Column span={12}>
                    <Textarea
                        description={
                            <>
                                <strong>Please write the reason for rejecting the content</strong>
                            </>
                        }
                        required={true}
                        value={value}
                        onChange={onChange}
                        validate={validate}
                        validation={validation}
                    />
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

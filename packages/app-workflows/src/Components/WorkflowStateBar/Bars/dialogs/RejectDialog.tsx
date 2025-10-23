import React, { useCallback } from "react";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { Dialog, Grid, Loader, Textarea } from "@webiny/admin-ui";
import { ReactComponent as RejectIcon } from "@webiny/icons/do_not_disturb.svg";

interface IRejectDialogProps {
    presenter: IWorkflowStatePresenter;
}

interface ITextareaNoteProps {
    value: string;
}

const TextareaNote = ({ value }: ITextareaNoteProps) => {
    if (value.trim().length > 0) {
        return null;
    }

    return (
        <span className={"wby-text-destructive-primary"}>
            You must write a reason when rejecting content.
        </span>
    );
};

export const RejectDialog = (props: IRejectDialogProps) => {
    const { presenter } = props;

    const [value, setValue] = React.useState<string>("");

    const onConfirm = useCallback(() => {
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
                    <Dialog.ConfirmButton text={"Reject content"} onClick={onConfirm} />
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
                        onChange={setValue}
                        note={<TextareaNote value={value} />}
                    />
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

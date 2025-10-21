import React, { useCallback } from "react";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { Dialog, Grid, Textarea } from "@webiny/admin-ui";
import { ReactComponent as ApproveIcon } from "@webiny/icons/check.svg";

interface IApproveDialogProps {
    presenter: IWorkflowStatePresenter;
}

export const ApproveDialog = (props: IApproveDialogProps) => {
    const { presenter } = props;

    const [value, setValue] = React.useState<string>("");

    const onConfirm = useCallback(() => {
        presenter.approve(value);
    }, [presenter.approve, value]);
    return (
        <Dialog
            open={true}
            onOpenChange={presenter.hideDialog}
            title={
                <>
                    <ApproveIcon className={"wby-fill-success"} />
                    Approve Content?
                </>
            }
            actions={
                <>
                    <Dialog.CancelButton onClick={presenter.hideDialog} />
                    <Dialog.ConfirmButton text={"Approve content"} onClick={onConfirm} />
                </>
            }
            showCloseButton={true}
            dismissible={true}
        >
            <Grid>
                <Grid.Column span={12}>
                    You are about to approve the <strong>{presenter.vm.step?.title}</strong>.
                    Authors and responsible reviewers will be notified.
                </Grid.Column>
                <Grid.Column span={12}>
                    <Textarea
                        description={
                            <>
                                <strong>Add a comment</strong> (optional)
                            </>
                        }
                        required={true}
                        value={value}
                        onChange={setValue}
                    />
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};

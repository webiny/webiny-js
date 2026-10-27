import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReviewerPicker } from "../../reviewerPicker/components/ReviewerPicker.js";
import type { ReassignDialogPresenter } from "../reassignAbstractions.js";

export interface ReassignDialogProps {
    presenter: ReassignDialogPresenter.Interface;
}

export const ReassignDialog = createReactiveComponent(function ReassignDialog(
    props: ReassignDialogProps
) {
    const { presenter } = props;
    const { vm } = presenter;

    let actions = (
        <>
            <Button
                variant={"tertiary"}
                text={vm.cancelLabel}
                onClick={() => presenter.dismiss()}
            />
            <Dialog.ConfirmAction
                text={vm.confirmLabel}
                disabled={!vm.canSubmit}
                onClick={() => presenter.submit()}
            />
        </>
    );
    if (vm.closeOnly) {
        actions = <Dialog.CancelAction text={vm.cancelLabel} />;
    }

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open && !vm.submitting) {
                    presenter.dismiss();
                }
            }}
            title={vm.title}
            loading={vm.status === "loading" || vm.submitting}
            actions={actions}
        >
            <div className={"flex flex-col gap-md"}>
                {vm.conflict && (
                    <Alert type={"warning"} variant={"subtle"}>
                        <div className={"font-semibold"}>{vm.conflict.title}</div>
                        <div>{vm.conflict.message}</div>
                    </Alert>
                )}
                {vm.dialogError && (
                    <Alert type={"danger"} variant={"subtle"}>
                        {vm.dialogError}
                    </Alert>
                )}
                {vm.message ? <Text size={"md"}>{vm.message}</Text> : null}
                {vm.showPicker && (
                    <ReviewerPicker
                        presenter={presenter.getPickerPresenter()}
                        label={"Reviewer"}
                        hint={vm.hint}
                    />
                )}
                {vm.fieldError && (
                    <Text size={"sm"} className={"text-destructive-default"}>
                        {vm.fieldError}
                    </Text>
                )}
            </div>
        </Dialog>
    );
});

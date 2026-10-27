import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Checkbox } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { Textarea } from "@webiny/admin-ui";
import type { ReviewActionDialogPresenter } from "../abstractions.js";

export interface ReviewActionDialogProps {
    presenter: ReviewActionDialogPresenter.Interface;
}

// One dialog for the five step actions, driven entirely by the presenter's view model.
export const ReviewActionDialog = createReactiveComponent(function ReviewActionDialog(
    props: ReviewActionDialogProps
) {
    const { presenter } = props;
    const { vm } = presenter;
    const collapsed = vm.conflict !== null || vm.status === "failed";

    let actions = (
        <>
            <Button
                variant={"tertiary"}
                text={vm.cancelLabel}
                onClick={() => presenter.dismiss()}
            />
            {/* admin-ui ConfirmAction is always primary; Reject and Cancel review confirm in red. */}
            <Button
                variant={vm.confirmVariant}
                text={vm.confirmLabel}
                disabled={!vm.canSubmit}
                onClick={() => presenter.submit()}
            />
        </>
    );
    if (collapsed) {
        actions = <Dialog.CancelAction text={"Close"} />;
    }

    const errorMessage = vm.fieldError ?? vm.commentError;
    const validation = { isValid: errorMessage === null, message: errorMessage ?? undefined };

    // The reject hint sits beside the live counter (design: hint left, counter right).
    let note: React.ReactNode = vm.commentNote;
    if (vm.commentCounter !== null) {
        note = (
            <div className={"flex justify-between"}>
                <span>{vm.commentNote}</span>
                <span>{vm.commentCounter}</span>
            </div>
        );
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
                        {vm.conflict.commentKept && (
                            <div>{"Your comment is kept below so you can copy it."}</div>
                        )}
                    </Alert>
                )}
                {vm.dialogError && (
                    <Alert type={"danger"} variant={"subtle"}>
                        {vm.dialogError}
                    </Alert>
                )}
                {vm.body ? <Text size={"md"}>{vm.body}</Text> : null}
                {vm.showComment && (
                    <Textarea
                        label={vm.commentLabel}
                        required={vm.commentRequired}
                        placeholder={vm.commentPlaceholder}
                        note={note}
                        value={vm.comment}
                        onChange={value => presenter.setComment(value)}
                        disabled={vm.conflict === null ? vm.submitting : false}
                        validation={validation}
                    />
                )}
                {vm.showNotify && vm.conflict === null && (
                    <Checkbox
                        label={vm.notifyLabel}
                        checked={vm.notify}
                        onChange={checked => presenter.setNotify(checked)}
                    />
                )}
            </div>
        </Dialog>
    );
});

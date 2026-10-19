import React from "react";
import { useEffect } from "react";
import { Alert } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { useNamedConfirmationDialog } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import type { ActiveReviewWarningDialogParams } from "../ActiveReviewGuard/abstractions.js";
import { buildActiveReviewWarning } from "../buildActiveReviewWarning.js";
import { ACTIVE_REVIEW_WARNING_BUSY_LABEL } from "../buildActiveReviewWarning.js";
import { ActiveReviewTrashFeature } from "../feature.js";

export const ActiveReviewWarningDialog = createReactiveComponent(
    function ActiveReviewWarningDialog() {
        const { params, onConfirm, onCancel, closeDialog } =
            useNamedConfirmationDialog<ActiveReviewWarningDialogParams>();
        const { presenter } = useFeature(ActiveReviewTrashFeature);
        const { reviews, action } = params;

        useEffect(() => {
            const texts = buildActiveReviewWarning({ reviews, action });
            presenter.init(texts);

            return () => {
                presenter.dispose();
            };
        }, [presenter, reviews, action]);

        const { vm } = presenter;

        if (!vm.title) {
            return null;
        }

        const handleConfirm = async () => {
            const finished = await presenter.confirm(onConfirm);
            if (finished) {
                closeDialog();
            }
        };

        const handleCancel = () => {
            if (presenter.dismiss()) {
                onCancel();
                closeDialog();
            }
        };

        const loading = vm.busy ? { text: ACTIVE_REVIEW_WARNING_BUSY_LABEL } : false;

        return (
            <Dialog
                open
                onOpenChange={open => {
                    if (!open) {
                        handleCancel();
                    }
                }}
                title={vm.title}
                loading={loading}
                dismissible={!vm.busy}
                actions={
                    <>
                        <Dialog.CancelAction text={"Cancel"} />
                        <Dialog.ConfirmAction onClick={handleConfirm} text={"Confirm"} />
                    </>
                }
            >
                <p>{vm.body}</p>
                <ul>
                    {vm.reviews.map((line, index) => (
                        <li key={index}>{line.text}</li>
                    ))}
                </ul>
                {vm.error && (
                    <Alert type={"danger"} variant={"subtle"}>
                        {vm.error}
                    </Alert>
                )}
            </Dialog>
        );
    }
);

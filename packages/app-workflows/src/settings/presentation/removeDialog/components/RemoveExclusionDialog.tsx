import React from "react";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import type { RemoveExclusionDialogPresenter } from "../abstractions.js";

export interface RemoveExclusionDialogProps {
    presenter: RemoveExclusionDialogPresenter.Interface;
}

/*
 * The Remove exclusion dialog (R326): the body, the alert after a failure (the row stays, R325),
 * Cancel and the destructive Remove. Nothing closes while removing; Remove keeps its label
 * (Copy gap 5).
 */
export const RemoveExclusionDialog = createReactiveComponent(function RemoveExclusionDialog(
    props: RemoveExclusionDialogProps
) {
    const { presenter } = props;
    const vm = presenter.vm;

    let alert: React.ReactNode = null;
    if (vm.alert !== null) {
        alert = (
            <Alert
                type="danger"
                variant="subtle"
                icon={<ErrorIcon data-icon="error" />}
                data-testid="remove-exclusion-alert"
            >
                <div>{vm.alert}</div>
            </Alert>
        );
    }

    const actions = (
        <>
            <Button
                variant="tertiary"
                text="Cancel"
                disabled={vm.removing}
                onClick={() => presenter.cancel()}
            />
            <Button
                variant="destructive"
                text="Remove"
                disabled={vm.removing}
                onClick={() => presenter.confirm()}
            />
        </>
    );

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    presenter.cancel();
                }
            }}
            title={vm.title}
            dismissible={!vm.removing}
            actions={actions}
        >
            <div data-testid="remove-exclusion-dialog" className="flex flex-col gap-md">
                {alert}
                <Text size="md">{vm.body}</Text>
            </div>
        </Dialog>
    );
});

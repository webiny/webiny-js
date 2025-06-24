import React, { useCallback } from "react";
import get from "lodash/get";
import { useUi } from "@webiny/app/hooks/useUi";
import { Dialog } from "@webiny/admin-ui";

export const DialogContainer = () => {
    const ui = useUi();
    const message = get(ui, "dialog.message");
    const {
        dataTestId,
        title,
        actions = { cancel: null, accept: { label: "OK" } },
        style
    } = get(ui, "dialog.options", {});

    const hideDialog = useCallback(() => {
        ui.setState(ui => ({ ...ui, dialog: null }));
    }, [ui]);

    return (
        <Dialog
            open={!!message}
            onClose={hideDialog}
            data-testid={dataTestId}
            style={style}
            title={title}
            actions={
                <>
                    {actions.cancel && (
                        <Dialog.CancelButton
                            onClick={actions.cancel.onClick}
                            text={actions.cancel.label}
                        />
                    )}
                    {actions.accept && (
                        <Dialog.ConfirmButton
                            onClick={actions.accept.onClick}
                            text={actions.accept.label}
                        />
                    )}
                </>
            }
        >
            {message}
        </Dialog>
    );
};

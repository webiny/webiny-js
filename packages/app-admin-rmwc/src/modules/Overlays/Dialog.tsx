import React, { useCallback } from "react";
import { get } from "lodash";
import { useUi } from "@webiny/app/hooks/useUi";
import { Dialog, DialogAccept, DialogTitle, DialogActions, DialogContent } from "@webiny/ui/Dialog";
import { ButtonPrimary } from "@webiny/ui/Button";

export const DialogContainer: React.FC = () => {
    const ui = useUi();
    const message: React.ReactNode = get(ui, "dialog.message");
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
        <Dialog open={!!message} onClose={hideDialog} data-testid={dataTestId} style={style}>
            {title && <DialogTitle>{title}</DialogTitle>}
            <DialogContent>{message}</DialogContent>
            <DialogActions>
                {actions.cancel && (
                    <DialogAccept onClick={actions.cancel.onClick}>
                        {actions.cancel.label}
                    </DialogAccept>
                )}
                {actions.accept && (
                    <ButtonPrimary
                        onClick={() => {
                            actions.accept.onClick();
                            hideDialog();
                        }}
                    >
                        {actions.accept.label}
                    </ButtonPrimary>
                )}
            </DialogActions>
        </Dialog>
    );
};

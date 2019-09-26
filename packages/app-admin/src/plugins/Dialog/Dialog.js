// @flow
import React, { useCallback } from "react";
import { get } from "lodash";
import { useUi } from "@webiny/app/hooks/useUi";
import { Dialog, DialogAccept, DialogTitle, DialogActions, DialogContent } from "@webiny/ui/Dialog";

const DialogMain = () => {
    const ui = useUi();
    const message = get(ui, "dialog.message");
    const { title, actions = { cancel: null, accept: { label: "OK" } } } = get(
        ui,
        "dialog.options",
        {}
    );

    const hideDialog = useCallback(() => {
        ui.setState(ui => ({ ...ui, dialog: null }));
    }, [ui]);

    return (
        <Dialog>
            <Dialog open={!!message} onClose={hideDialog}>
                {title && <DialogTitle>{title}</DialogTitle>}
                <DialogContent>{message}</DialogContent>
                <DialogActions>
                    {actions.cancel && (
                        <DialogAccept onClick={actions.cancel.onClick}>
                            {actions.cancel.label}
                        </DialogAccept>
                    )}
                    {actions.accept && (
                        <DialogAccept onClick={actions.accept.onClick}>
                            {actions.accept.label}
                        </DialogAccept>
                    )}
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default DialogMain;

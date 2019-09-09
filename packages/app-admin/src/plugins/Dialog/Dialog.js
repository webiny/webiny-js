// @flow
import React, { useCallback } from "react";
import { get } from "lodash";
import { useUi } from "@webiny/app/hooks/useUi";
import { Dialog, DialogAccept, DialogTitle, DialogActions, DialogContent } from "@webiny/ui/Dialog";

const DialogMain = () => {
    const ui = useUi();
    const message = get(ui, "dialog.message");
    const options = get(ui, "dialog.options", {});

    const hideDialog = useCallback(() => {
        ui.setState(ui => ({ ...ui, dialog: null }));
    }, [ui]);

    return (
        <Dialog>
            <Dialog open={!!message} onClose={hideDialog}>
                {options.title && <DialogTitle>{options.title}</DialogTitle>}
                <DialogContent>{message}</DialogContent>
                <DialogActions>
                    <DialogAccept>OK</DialogAccept>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default DialogMain;

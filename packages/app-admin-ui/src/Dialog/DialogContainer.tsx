import React, { useCallback, useEffect, useState } from "react";
import { useUi } from "@webiny/app/hooks/useUi.js";
import { Dialog } from "@webiny/admin-ui";

export const DialogContainer = () => {
    const ui = useUi();
    const [isLoading, setIsLoading] = useState(false);
    const message: React.ReactNode = ui.dialog?.message;

    const {
        dataTestId,
        title,
        loading,
        actions = { cancel: null, accept: { label: "OK" } },
        style,
        onClose,
        showCloseButton
    } = ui.dialog?.options || {};

    const hideDialog = useCallback(() => {
        ui.setState(ui => ({ ...ui, dialog: null }));
        if (typeof onClose === "function") {
            onClose();
        }
    }, [ui]);

    /**
     * We need this part because message can change while the dialog is opened and in loading state.
     */
    useEffect(() => {
        setIsLoading(false);
    }, [ui.dialog?.message]);

    const handleConfirm = async () => {
        if (!actions.accept.onClick) {
            /**
             * Should not happen as users should define "accept.onClick" function, but just in case lets show the information.
             * Possible to happen in development process.
             */
            console.info("There is no actions.accept.onClick callback defined.");
            hideDialog();
            return;
        }
        setIsLoading(true);
        await actions.accept.onClick();
        setIsLoading(false);
        hideDialog();
    };

    return (
        <Dialog
            open={!!message}
            onClose={hideDialog}
            data-testid={dataTestId}
            style={style}
            showCloseButton={showCloseButton}
            title={title}
            actions={
                !actions.cancel && !actions.accept ? null : (
                    <>
                        {actions.cancel && (
                            <Dialog.CancelAction
                                onClick={actions.cancel.onClick}
                                text={actions.cancel.label}
                            />
                        )}
                        {actions.accept && (
                            <Dialog.ConfirmAction
                                onClick={handleConfirm}
                                text={actions.accept.label}
                                data-testid={"confirmationdialog-confirm-action"}
                            />
                        )}
                    </>
                )
            }
            loading={isLoading ? loading : false}
        >
            {message}
        </Dialog>
    );
};

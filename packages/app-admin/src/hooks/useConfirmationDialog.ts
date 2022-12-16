import React from "react";
import { useUi } from "@webiny/app/hooks/useUi";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-admin/hooks/use-confirmation-dialog");

interface Params {
    title?: React.ReactNode;
    message?: React.ReactNode;
    acceptLabel?: React.ReactNode;
    cancelLabel?: React.ReactNode;
    [key: string]: any;
}

interface UseConfirmationDialogResponse {
    showConfirmation: (onAccept: () => void, onCancel?: () => void) => void;
}

const useConfirmationDialog = ({
    title,
    message,
    acceptLabel = t`Confirm`,
    cancelLabel = t`Cancel`,
    ...options
}: Params = {}): UseConfirmationDialogResponse => {
    const ui = useUi();

    return {
        showConfirmation: (onAccept, onCancel) => {
            ui.setState(ui => {
                return {
                    ...ui,
                    dialog: {
                        message: message || t`Are you sure you want to continue?`,
                        options: {
                            ...options,
                            title: title || t`Confirmation`,
                            actions: {
                                accept: {
                                    label: acceptLabel,
                                    onClick: onAccept
                                },
                                cancel: {
                                    label: cancelLabel,
                                    onClick: onCancel
                                }
                            }
                        }
                    }
                };
            });
        }
    };
};

export { useConfirmationDialog };

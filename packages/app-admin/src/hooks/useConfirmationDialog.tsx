import React from "react";
import { useUi } from "@webiny/app/hooks/useUi.js";
import { i18n } from "@webiny/app/i18n/index.js";

const t = i18n.ns("app-admin/hooks/use-confirmation-dialog");

interface Params {
    title?: React.ReactNode;
    message?: React.ReactNode;
    acceptLabel?: React.ReactNode;
    cancelLabel?: React.ReactNode;
    loading?: boolean | { text?: string };
    [key: string]: any;
}

export type ShowConfirmationOnAccept = (() => void) | (() => Promise<void>);

export interface UseConfirmationDialogResponse {
    showConfirmation: (onAccept: ShowConfirmationOnAccept, onCancel?: () => void) => void;
}

const useConfirmationDialog = ({
    title = t`Confirmation`,
    message,
    acceptLabel = t`Confirm`,
    cancelLabel = t`Cancel`,
    loading = true,
    ...options
}: Params = {}): UseConfirmationDialogResponse => {
    const ui = useUi();

    return {
        showConfirmation: (onAccept, onCancel) => {
            ui.setState(ui => {
                return {
                    ...ui,
                    dialog: {
                        loading: true,
                        message: message || t`Are you sure you want to continue?`,
                        options: {
                            ...options,
                            title,
                            loading,
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

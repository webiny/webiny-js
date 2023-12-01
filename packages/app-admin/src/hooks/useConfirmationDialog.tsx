import React from "react";
import { useUi } from "@webiny/app/hooks/useUi";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";

const t = i18n.ns("app-admin/hooks/use-confirmation-dialog");

interface Params {
    title?: React.ReactNode;
    message?: React.ReactNode;
    acceptLabel?: React.ReactNode;
    cancelLabel?: React.ReactNode;
    loading?: React.ReactNode;
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
    loading = <CircularProgress />,
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

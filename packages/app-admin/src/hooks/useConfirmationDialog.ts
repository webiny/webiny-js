import React from "react";
import { useUi } from "@webiny/app/hooks/useUi";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-admin/hooks/use-confirmation-dialog");

type Args = {
    title?: React.ReactNode;
    message?: React.ReactNode;
    [key: string]: any;
};

const useConfirmationDialog = ({ title, message, ...options }: Args = {}) => {
    const ui = useUi();

    return {
        showConfirmation: (onAccept, onCancel = null) => {
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
                                    label: t`Confirm`,
                                    onClick: onAccept
                                },
                                cancel: {
                                    label: t`Cancel`,
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

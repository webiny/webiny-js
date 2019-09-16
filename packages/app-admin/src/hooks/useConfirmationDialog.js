// @flow
import { useUi } from "@webiny/app/components";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-admin/hooks/use-confirmation-dialog");

const useConfirmationDialog = ({ title, message }) => {
    const ui = useUi();

    return {
        showConfirmation: (onAccept, onCancel) => {
            ui.setState(ui => {
                return {
                    ...ui,
                    dialog: {
                        message,
                        options: {
                            title,
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

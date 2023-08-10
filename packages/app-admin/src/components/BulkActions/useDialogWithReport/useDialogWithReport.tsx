import React from "react";
import { useUi } from "@webiny/app/hooks/useUi";
import { i18n } from "@webiny/app/i18n";
import { CircularProgress } from "@webiny/ui/Progress";
import { ResultDialogMessage } from "./DialogMessage";
import { Result } from "../Worker";

const t = i18n.ns("app-admin/hooks/use-dialog-with-report");

export interface ShowConfirmationDialogParams {
    execute: (() => void) | (() => Promise<void>);
    title?: string;
    message?: string;
    loadingLabel?: string;
}

export interface ShowResultsDialogParams {
    results: Result[];
    title?: string;
    message?: string;
}

export interface UseDialogWithReportResponse {
    showConfirmationDialog: (params: ShowConfirmationDialogParams) => void;
    showResultsDialog: (results: ShowResultsDialogParams) => void;
}

export const useDialogWithReport = (): UseDialogWithReportResponse => {
    const ui = useUi();

    const showConfirmationDialog = ({
        execute,
        title,
        message,
        loadingLabel
    }: ShowConfirmationDialogParams) => {
        ui.setState(ui => {
            return {
                ...ui,
                dialog: {
                    message: message || t`Are you sure you want to continue?`,
                    options: {
                        title: title || t`Confirm`,
                        loading: <CircularProgress label={loadingLabel} />,
                        actions: {
                            accept: {
                                label: t`Confirm`,
                                onClick: async () => {
                                    await execute();
                                }
                            },
                            cancel: {
                                label: t`Cancel`
                            }
                        }
                    }
                }
            };
        });
    };

    const showResultsDialog = ({ title, ...params }: ShowResultsDialogParams) => {
        setTimeout(() => {
            ui.setState(ui => {
                return {
                    ...ui,
                    dialog: {
                        message: <ResultDialogMessage {...params} />,
                        options: {
                            title: title || t`Results`,
                            actions: {
                                cancel: {
                                    label: t`Close`
                                }
                            }
                        }
                    }
                };
            });
        }, 10);
    };

    return {
        showConfirmationDialog,
        showResultsDialog
    };
};

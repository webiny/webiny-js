import React from "react";
import { ReactComponent as ErrorIcon } from "@material-design-icons/svg/round/error.svg";
import { ReactComponent as SuccessIcon } from "@material-design-icons/svg/round/check_circle.svg";
import { useUi } from "@webiny/app/hooks/useUi";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { List, ListItem, ListItemGraphic, ListItemText } from "@webiny/ui/List";
import { CircularProgress } from "@webiny/ui/Progress";

import { Result } from "~/hooks/Worker";

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

type ResultDialogMessageProps = Pick<ShowResultsDialogParams, "results" | "message">;

const ResultDialogMessage: React.FC<ResultDialogMessageProps> = ({ results, message }) => {
    return (
        <>
            {message && <div style={{ marginBottom: 16 }}>{message}</div>}
            <List nonInteractive={true}>
                {results.map((result, index) => (
                    <ListItem key={`item-${index}`}>
                        <ListItemGraphic>
                            <Icon
                                icon={result.status === "success" ? <SuccessIcon /> : <ErrorIcon />}
                            />
                        </ListItemGraphic>
                        <ListItemText>{result.message} </ListItemText>
                    </ListItem>
                ))}
            </List>
        </>
    );
};

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

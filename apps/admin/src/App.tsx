import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { ContentEntryListConfig } from "@webiny/app-headless-cms";
import { ReactComponent as SendIcon } from "@material-design-icons/svg/outlined/send.svg";
import "./App.scss";

const { BulkAction } = ContentEntryListConfig.Browser;

const ActionSendToExternal = () => {
    const { useWorker, useButtons, useDialog } = BulkAction;

    // useButtons() exposes the button components also used internally: use these to keep the UI consistent.
    const { IconButton } = useButtons();
    // useWorker exposes the currently selected items and the processInSeries function.
    const worker = useWorker();
    // useDialog exposes method to open confirmation and result dialogs.
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const openSendToExternalServiceDialog = () =>
        showConfirmationDialog({
            title: "Send to External Service",
            message: `You are about to send the selected entries. Are you sure you want to continue?`,
            loadingLabel: `Processing`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const response = await fetch(
                            "https://webhook.site/4665b7ce-dc66-4901-9c5c-b830c283d49d",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(item.id)
                            }
                        );

                        // Add the result as
                        report.success({
                            title: item.meta.title,
                            message: `Entry successfully sent, response status: ${response.status}`
                        });
                    } catch (e) {
                        report.error({
                            title: item.meta.title,
                            message: e.message
                        });
                    }
                });

                // Reset the selected items
                worker.resetItems();

                // Show a dialog with operation result
                showResultsDialog({
                    results: worker.results,
                    title: "Send to External Service",
                    message: "Operation completed, here below you find the complete report:"
                });
            }
        });

    return (
        <IconButton
            icon={<SendIcon />}
            onAction={openSendToExternalServiceDialog}
            label={`Send to external service`}
            tooltipPlacement={"bottom"}
        />
    );
};

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <ContentEntryListConfig>
                <BulkAction name={"send-to-external"} element={<ActionSendToExternal />} />
            </ContentEntryListConfig>
        </Admin>
    );
};

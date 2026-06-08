import React from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { observer } from "mobx-react-lite";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { useSnackbar } from "@webiny/app-admin";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useCms, useModel } from "~/admin/hooks/index.js";
import { getEntriesLabel } from "~/admin/components/ContentEntries/BulkActions/BulkActions.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { Tooltip } from "@webiny/admin-ui";

export const ActionDelete = observer(() => {
    const { model } = useModel();
    const { deleteEntry } = useCms();
    const presenter = useContentEntriesPresenter();
    const { showSnackbar } = useSnackbar();

    const { useWorker, useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = getEntriesLabel();

    const openDeleteEntriesDialog = () =>
        showConfirmationDialog({
            title: "Trash entries",
            message: `You are about to move ${entriesLabel} to trash. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                if (worker.isSelectedAll) {
                    await worker.processInBulk({ action: "MoveToTrash" });
                    worker.resetItems();
                    showSnackbar(
                        "All entries will be moved to trash. This process will be carried out in the background and may take some time. You can safely navigate away from this page while the process is running.",
                        {
                            dismissIcon: true,
                            timeout: -1
                        }
                    );
                    return;
                }

                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const { id } = parseIdentifier(item.id);
                        const response = await deleteEntry({ model, id });

                        if (typeof response !== "boolean") {
                            throw new Error(
                                response.error.message ||
                                    "Unknown error while moving the entry to trash."
                            );
                        }

                        report.success({
                            title: `${item.meta.title}`,
                            message: "Entry successfully moved to trash."
                        });
                    } catch (e) {
                        report.error({
                            title: `${item.meta.title}`,
                            message: e.message
                        });
                    }
                });

                worker.resetItems();
                await presenter.list.actions.refresh();

                showResultsDialog({
                    results: worker.results,
                    title: "Trash entries",
                    message: "Finished moving entries to trash! See full report below:"
                });
            }
        });

    return (
        <Tooltip
            side={"bottom"}
            content={`Trash ${entriesLabel}`}
            trigger={
                <ButtonDefault icon={<DeleteIcon />} onAction={openDeleteEntriesDialog} size={"sm"}>
                    {"Trash"}
                </ButtonDefault>
            }
        />
    );
});

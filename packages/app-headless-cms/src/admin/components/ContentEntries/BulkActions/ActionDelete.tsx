import React, { useMemo } from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { useRecords } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { useCms, useContentEntry } from "~/admin/hooks";
import { getEntriesLabel } from "~/admin/components/ContentEntries/BulkActions/BulkActions";

export const ActionDelete = observer(() => {
    const { deleteEntry } = useCms();
    const { contentModel } = useContentEntry();
    const { removeRecordFromCache } = useRecords();

    const { useWorker, useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = useMemo(() => {
        return getEntriesLabel(worker.items.length);
    }, [worker.items.length]);

    const openDeleteEntriesDialog = () =>
        showConfirmationDialog({
            title: "Delete entries",
            message: `You are about to delete ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const response = await deleteEntry({
                            model: contentModel,
                            entry: item,
                            id: item.id
                        });

                        const { error } = response;

                        if (error) {
                            throw new Error(
                                error.message || "Unknown error while deleting the entry"
                            );
                        }

                        removeRecordFromCache(item.id);

                        report.success({
                            title: `${item.meta.title}`,
                            message: "Entry successfully deleted."
                        });
                    } catch (e) {
                        report.error({
                            title: `${item.meta.title}`,
                            message: e.message
                        });
                    }
                });

                worker.resetItems();

                showResultsDialog({
                    results: worker.results,
                    title: "Delete entries",
                    message: "Finished deleting entries! See full report below:"
                });
            }
        });

    return (
        <IconButton
            icon={<DeleteIcon />}
            onAction={openDeleteEntriesDialog}
            label={`Delete ${entriesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
});

import React, { useMemo } from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/filled/delete.svg";
import { useRecords } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { useCms, useContentEntry } from "~/admin/hooks";

const ActionDelete = () => {
    const { deleteEntry } = useCms();
    const { contentModel } = useContentEntry();
    const { removeRecordFromCache } = useRecords();

    const { useWorker, useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = useMemo(() => {
        const count = worker.items.length || 0;
        return `${count} ${count === 1 ? "entry" : "entries"}`;
    }, [worker.items.length]);

    const openPublishEntriesDialog = () =>
        showConfirmationDialog({
            title: "Delete entries",
            message: `You are about to publish ${entriesLabel}. Are you sure you want to continue?`,
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
                    message: "Operation completed, here below you find the complete report:"
                });
            }
        });

    return (
        <IconButton
            icon={<DeleteIcon />}
            onAction={openPublishEntriesDialog}
            label={`Delete ${entriesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
};

export default observer(ActionDelete);

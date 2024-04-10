import React, { useMemo } from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { useRecords } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { useCms, useContentEntry } from "~/admin/hooks";
import { getEntriesLabel } from "~/admin/components/ContentEntries/BulkActions/BulkActions";
import { parseIdentifier } from "@webiny/utils/parseIdentifier";

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
            title: "Trash entries",
            message: `You are about to trash ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        /**
                         * We need an entryId because we want to delete all revisions of the entry.
                         * By sending an entryId (id without #version), we are telling to the API to delete all revisions.
                         */
                        const { id } = parseIdentifier(item.id);
                        const response = await deleteEntry({
                            model: contentModel,
                            entry: item,
                            id
                        });

                        const { error } = response;

                        if (error) {
                            throw new Error(
                                error.message || "Unknown error while trashing the entry."
                            );
                        }

                        removeRecordFromCache(item.id);

                        report.success({
                            title: `${item.meta.title}`,
                            message: "Entry successfully trashed."
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
                    title: "Trash entries",
                    message: "Finished trashing entries! See full report below:"
                });
            }
        });

    return (
        <IconButton
            icon={<DeleteIcon />}
            onAction={openDeleteEntriesDialog}
            label={`Trash ${entriesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
});

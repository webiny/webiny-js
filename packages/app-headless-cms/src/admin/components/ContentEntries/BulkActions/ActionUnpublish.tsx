import React, { useMemo } from "react";
import { ReactComponent as UnpublishIcon } from "@material-design-icons/svg/round/settings_backup_restore.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { useCms, useContentEntry, usePermission } from "~/admin/hooks";
import { useRecords } from "@webiny/app-aco";

export const ActionUnpublish = () => {
    const { canUnpublish } = usePermission();
    const { unpublishEntryRevision } = useCms();
    const { contentModel } = useContentEntry();
    const { updateRecordInCache } = useRecords();
    const { useWorker, useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const { processInSeries, items, results } = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = useMemo(() => {
        const count = items.length || 0;

        if (items.length === 1) {
            return `${count} entry`;
        }

        return `${count} entries`;
    }, [items.length]);

    const openUnpublishEntriesDialog = () =>
        showConfirmationDialog({
            title: "Unpublish entries",
            message: `You are about to unpublish ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Unpublishing ${entriesLabel}`,
            execute: async () => {
                await processInSeries(async ({ item, report }) => {
                    try {
                        const response = await unpublishEntryRevision({
                            model: contentModel,
                            entry: item,
                            id: item.id
                        });

                        const { error, entry } = response;

                        if (error) {
                            throw new Error("Error while updating the entry status");
                        }

                        updateRecordInCache(entry);

                        report.success({
                            message: `${item.meta.title} unpublished`
                        });
                    } catch {
                        report.error({
                            message: `${item.meta.title} errored`
                        });
                    }
                });

                showResultsDialog({
                    results,
                    title: "Unpublish entries",
                    message: "Operation completed, here below you find the complete report:"
                });
            }
        });

    if (!canUnpublish("cms.contentEntry")) {
        return null;
    }

    return (
        <IconButton
            icon={<UnpublishIcon />}
            onAction={openUnpublishEntriesDialog}
            label={`Unpublish ${entriesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
};
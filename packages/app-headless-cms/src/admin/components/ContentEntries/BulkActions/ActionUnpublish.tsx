import React, { useMemo } from "react";
import { ReactComponent as UnpublishIcon } from "@material-design-icons/svg/round/settings_backup_restore.svg";
import { observer } from "mobx-react-lite";
import { useRecords } from "@webiny/app-aco";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { useCms, useContentEntry, usePermission } from "~/admin/hooks";

const ActionUnpublish = () => {
    const { canUnpublish } = usePermission();
    const { unpublishEntryRevision } = useCms();
    const { contentModel } = useContentEntry();
    const { updateRecordInCache } = useRecords();

    const { useWorker, useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = useMemo(() => {
        const count = worker.items.length || 0;
        return `${count} ${count === 1 ? "entry" : "entries"}`;
    }, [worker.items.length]);

    const openUnpublishEntriesDialog = () =>
        showConfirmationDialog({
            title: "Unpublish entries",
            message: `You are about to unpublish ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const response = await unpublishEntryRevision({
                            model: contentModel,
                            entry: item,
                            id: item.id
                        });

                        const { error, entry } = response;

                        if (error) {
                            throw new Error(
                                error.message || "Unknown error while unpublishing the entry"
                            );
                        }

                        updateRecordInCache(entry);

                        report.success({
                            title: `${item.meta.title}`,
                            message: "Entry successfully unpublished."
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

export default observer(ActionUnpublish);

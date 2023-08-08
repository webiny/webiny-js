import React, { useMemo } from "react";
import { ReactComponent as PublishIcon } from "@material-design-icons/svg/round/publish.svg";
import { useRecords } from "@webiny/app-aco";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { usePermission, useCms, useContentEntry } from "~/admin/hooks";

export const ActionPublish = () => {
    const { canPublish } = usePermission();
    const { publishEntryRevision } = useCms();
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

    const openPublishEntriesDialog = () =>
        showConfirmationDialog({
            title: "Publish entries",
            message: `You are about to publish ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Publishing ${entriesLabel}`,
            execute: async () => {
                await processInSeries(async ({ item, report }) => {
                    try {
                        const response = await publishEntryRevision({
                            model: contentModel,
                            entry: item,
                            id: item.id
                        });

                        const { error, entry } = response;

                        if (error) {
                            throw new Error("Error while updating the entry status");
                        }

                        console.log("entry", entry);

                        updateRecordInCache(entry);

                        report.success({
                            message: `${item.meta.title} published`
                        });
                    } catch {
                        report.error({
                            message: `${item.meta.title} errored`
                        });
                    }
                });

                showResultsDialog({
                    results,
                    title: "Publish entries",
                    message: "Operation completed, here below you find the complete report:"
                });
            }
        });

    if (!canPublish("cms.contentEntry")) {
        return null;
    }

    return (
        <IconButton
            icon={<PublishIcon />}
            onAction={openPublishEntriesDialog}
            label={`Publish ${entriesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
};

import React, { useMemo } from "react";
import { ReactComponent as PublishIcon } from "@material-design-icons/svg/outlined/publish.svg";
import { useRecords } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { usePermission, useCms, useContentEntry } from "~/admin/hooks";
import { getEntriesLabel } from "~/admin/components/ContentEntries/BulkActions/BulkActions";

export const ActionPublish = observer(() => {
    const { canPublish } = usePermission();
    const { publishEntryRevision } = useCms();
    const { contentModel } = useContentEntry();
    const { updateRecordInCache } = useRecords();

    const { useWorker, useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = useMemo(() => {
        return getEntriesLabel(worker.items.length);
    }, [worker.items.length]);

    const openPublishEntriesDialog = () =>
        showConfirmationDialog({
            title: "Publish entries",
            message: `You are about to publish ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const response = await publishEntryRevision({
                            model: contentModel,
                            entry: item,
                            id: item.id
                        });

                        const { error, entry } = response;

                        if (error) {
                            throw new Error(
                                error.message || "Unknown error while publishing the entry"
                            );
                        }

                        updateRecordInCache(entry);

                        report.success({
                            title: `${item.meta.title}`,
                            message: "Entry successfully published."
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
                    title: "Publish entries",
                    message: "Finished publishing entries! See full report below:"
                });
            }
        });

    if (!canPublish("cms.contentEntry")) {
        console.log("You don't have permissions to publish entries.");
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
});

import React, { useMemo } from "react";
import { ReactComponent as PublishIcon } from "@material-design-icons/svg/filled/publish.svg";
import { useRecords } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { usePermission, useCms, useContentEntry } from "~/admin/hooks";

const ActionPublish = () => {
    const { canPublish } = usePermission();
    const { publishEntryRevision } = useCms();
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

export default observer(ActionPublish);

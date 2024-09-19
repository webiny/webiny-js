import React from "react";
import { ReactComponent as PublishIcon } from "@material-design-icons/svg/outlined/publish.svg";
import { observer } from "mobx-react-lite";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { usePermission, useCms, useModel } from "~/admin/hooks";
import { getEntriesLabel } from "~/admin/components/ContentEntries/BulkActions/BulkActions";
import { useRecords } from "@webiny/app-aco";
import { useSnackbar } from "@webiny/app-admin";

export const ActionPublish = observer(() => {
    const { model } = useModel();
    const { canPublish } = usePermission();
    const { publishEntryRevision } = useCms();
    const { updateRecordInCache } = useRecords();
    const { showSnackbar } = useSnackbar();

    const { useWorker, useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = getEntriesLabel();

    const openPublishEntriesDialog = () =>
        showConfirmationDialog({
            title: "Publish entries",
            message: `You are about to publish ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                if (worker.isSelectedAll) {
                    await worker.processInBulk({
                        action: "Publish"
                    });
                    worker.resetItems();
                    showSnackbar(
                        "All entries will be published. This process will be carried out in the background and may take some time. You can safely navigate away from this page while the process is running.",
                        {
                            dismissIcon: true,
                            timeout: -1
                        }
                    );
                    return;
                }

                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const response = await publishEntryRevision({ model, id: item.id });

                        const { error } = response;

                        if (error) {
                            throw new Error(
                                error.message || "Unknown error while publishing the entry"
                            );
                        }

                        updateRecordInCache(response.entry);

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

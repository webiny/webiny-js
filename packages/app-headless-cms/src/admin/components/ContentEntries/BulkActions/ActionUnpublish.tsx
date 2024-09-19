import React from "react";
import { ReactComponent as UnpublishIcon } from "@material-design-icons/svg/outlined/settings_backup_restore.svg";
import { observer } from "mobx-react-lite";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { useCms, useModel, usePermission } from "~/admin/hooks";
import { getEntriesLabel } from "~/admin/components/ContentEntries/BulkActions/BulkActions";
import { useRecords } from "@webiny/app-aco";
import { useSnackbar } from "@webiny/app-admin";

export const ActionUnpublish = observer(() => {
    const { model } = useModel();
    const { canUnpublish } = usePermission();
    const { unpublishEntryRevision } = useCms();
    const { updateRecordInCache } = useRecords();
    const { showSnackbar } = useSnackbar();

    const { useWorker, useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = getEntriesLabel();

    const openUnpublishEntriesDialog = () =>
        showConfirmationDialog({
            title: "Unpublish entries",
            message: `You are about to unpublish ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                if (worker.isSelectedAll) {
                    await worker.processInBulk({
                        action: "Unpublish"
                    });
                    worker.resetItems();
                    showSnackbar(
                        "All entries will be unpublished. This process will be carried out in the background and may take some time. You can safely navigate away from this page while the process is running.",
                        {
                            dismissIcon: true,
                            timeout: -1
                        }
                    );
                    return;
                }

                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const response = await unpublishEntryRevision({
                            model,
                            id: item.id
                        });

                        const { error } = response;

                        if (error) {
                            throw new Error(
                                error.message || "Unknown error while unpublishing the entry"
                            );
                        }

                        updateRecordInCache(response.entry);

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
                    message: "Finished unpublishing entries! See full report below:"
                });
            }
        });

    if (!canUnpublish("cms.contentEntry")) {
        console.log("You don't have permissions to unpublish entries.");
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
});

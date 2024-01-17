import React, { useMemo } from "react";
import { ReactComponent as UnpublishIcon } from "@material-design-icons/svg/outlined/settings_backup_restore.svg";
import { observer } from "mobx-react-lite";
import { useFolders, useRecords } from "@webiny/app-aco";
import { PageListConfig } from "~/admin/config/pages";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { usePagesPermissions } from "~/hooks/permissions";
import { getPagesLabel } from "~/admin/components/BulkActions/BulkActions";

export const ActionUnpublish = observer(() => {
    const { canUnpublish } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();
    const { unpublishPage, client } = useAdminPageBuilder();
    const { getRecord } = useRecords();

    const { useWorker, useButtons, useDialog } = PageListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const canUnpublishAll = useMemo(() => {
        return worker.items.every(item => {
            return canUnpublish() && flp.canManageContent(item.location?.folderId);
        });
    }, [worker.items]);

    const pagesLabel = useMemo(() => {
        return getPagesLabel(worker.items.length);
    }, [worker.items.length]);

    const openUnpublishPagesDialog = () =>
        showConfirmationDialog({
            title: "Unpublish pages",
            message: `You are about to unpublish ${pagesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${pagesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const response = await unpublishPage(
                            { id: item.data.id },
                            {
                                client: client
                            }
                        );

                        const { error, page } = response;

                        if (error) {
                            throw new Error(
                                error.message || "Unknown error while unpublishing the page"
                            );
                        }

                        await getRecord(page.id);

                        report.success({
                            title: `${item.data.title}`,
                            message: "Page successfully unpublished."
                        });
                    } catch (e) {
                        report.error({
                            title: `${item.title}`,
                            message: e.message
                        });
                    }
                });

                worker.resetItems();

                showResultsDialog({
                    results: worker.results,
                    title: "Unpublish pages",
                    message: "Finished unpublishing pages! See full report below:"
                });
            }
        });

    if (!canUnpublishAll) {
        console.log("You don't have permissions to unpublish pages.");
        return null;
    }

    return (
        <IconButton
            icon={<UnpublishIcon />}
            onAction={openUnpublishPagesDialog}
            label={`Unpublish ${pagesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
});

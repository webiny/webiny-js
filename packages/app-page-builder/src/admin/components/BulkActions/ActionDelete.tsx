import React, { useMemo } from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { useFolders, useRecords } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { PageListConfig } from "~/admin/config/pages";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { usePagesPermissions } from "~/hooks/permissions";
import { getPagesLabel } from "~/admin/components/BulkActions/BulkActions";

export const ActionDelete = observer(() => {
    const { canDelete } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    const { deletePage, client } = useAdminPageBuilder();
    const { removeRecordFromCache } = useRecords();

    const { useWorker, useButtons, useDialog } = PageListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const pagesLabel = useMemo(() => {
        return getPagesLabel(worker.items.length);
    }, [worker.items.length]);

    const canDeleteAll = useMemo(() => {
        return worker.items.every(item => {
            return (
                canDelete(item.data.createdBy.id) && flp.canManageContent(item.location?.folderId)
            );
        });
    }, [worker.items]);

    const openDeletePagesDialog = () =>
        showConfirmationDialog({
            title: "Delete pages",
            message: `You are about to delete ${pagesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${pagesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const response = await deletePage(
                            { id: item.data.id },
                            {
                                client: client,
                                mutationOptions: {
                                    update(_, { data }) {
                                        if (data.pageBuilder.deletePage.error) {
                                            return;
                                        }
                                    }
                                }
                            }
                        );

                        const { error } = response;

                        if (error) {
                            throw new Error(
                                error.message || "Unknown error while deleting the page"
                            );
                        }

                        removeRecordFromCache(item.data.pid);

                        report.success({
                            title: `${item.title}`,
                            message: "Page successfully deleted."
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
                    title: "Delete pages",
                    message: "Finished deleting pages! See full report below:"
                });
            }
        });

    if (!canDeleteAll) {
        console.log("You don't have permissions to delete pages.");
        return null;
    }

    return (
        <IconButton
            icon={<DeleteIcon />}
            onAction={openDeletePagesDialog}
            label={`Delete ${pagesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
});

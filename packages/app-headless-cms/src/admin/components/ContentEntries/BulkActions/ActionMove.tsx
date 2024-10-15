import React, { useCallback } from "react";
import { ReactComponent as MoveIcon } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { useRecords, useMoveToFolderDialog, useNavigateFolder } from "@webiny/app-aco";
import { useSnackbar } from "@webiny/app-admin";
import { FolderItem } from "@webiny/app-aco/types";
import { observer } from "mobx-react-lite";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { ROOT_FOLDER } from "~/admin/constants";
import { getEntriesLabel } from "~/admin/components/ContentEntries/BulkActions/BulkActions";

export const ActionMove = observer(() => {
    const { moveRecord } = useRecords();
    const { currentFolderId } = useNavigateFolder();
    const { showSnackbar } = useSnackbar();

    const { useWorker, useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();
    const { showDialog: showMoveDialog } = useMoveToFolderDialog();

    const entriesLabel = getEntriesLabel();

    const openWorkerDialog = useCallback(
        (folder: FolderItem) => {
            showConfirmationDialog({
                title: "Move entries",
                message: `You are about to move ${entriesLabel} to ${folder.title}. Are you sure you want to continue?`,
                loadingLabel: `Processing ${entriesLabel}`,
                execute: async () => {
                    if (worker.isSelectedAll) {
                        await worker.processInBulk({
                            action: "MoveToFolder",
                            where: {
                                wbyAco_location: {
                                    folderId_not: folder.id
                                }
                            },
                            data: {
                                folderId: folder.id
                            }
                        });
                        worker.resetItems();
                        showSnackbar(
                            `All entries will be moved to ${folder.title}. This process will be carried out in the background and may take some time. You can safely navigate away from this page while the process is running.`,
                            {
                                dismissIcon: true,
                                timeout: -1
                            }
                        );
                        return;
                    }

                    await worker.processInSeries(async ({ item, report }) => {
                        try {
                            await moveRecord({
                                id: item.id,
                                location: {
                                    folderId: folder.id
                                }
                            });

                            report.success({
                                title: `${item.meta.title}`,
                                message: "Entry successfully moved."
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
                        title: "Move entries",
                        message: "Finished moving entries! See full report below:"
                    });
                }
            });
        },
        [entriesLabel, worker.isSelectedAll]
    );

    const openMoveEntriesDialog = () =>
        showMoveDialog({
            title: "Select folder",
            message: "Select a new location for selected entries:",
            loadingLabel: `Processing ${entriesLabel}`,
            acceptLabel: `Move`,
            focusedFolderId: currentFolderId || ROOT_FOLDER,
            async onAccept({ folder }) {
                openWorkerDialog(folder);
            }
        });

    return (
        <IconButton
            icon={<MoveIcon />}
            onAction={openMoveEntriesDialog}
            label={`Move ${entriesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
});

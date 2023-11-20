import React, { useCallback, useMemo } from "react";
import { ReactComponent as MoveIcon } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { observer } from "mobx-react-lite";
import { useMoveToFolderDialog, useNavigateFolder } from "@webiny/app-aco";
import { FolderItem } from "@webiny/app-aco/types";

import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";
import { getFilesLabel } from "~/components/BulkActions/BulkActions";
import { ROOT_FOLDER } from "~/constants";

export const ActionMove = observer(() => {
    const { moveFileToFolder } = useFileManagerView();
    const { currentFolderId } = useNavigateFolder();

    const { useWorker, useButtons, useDialog } = FileManagerViewConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();
    const { showDialog: showMoveDialog } = useMoveToFolderDialog();

    const filesLabel = useMemo(() => {
        return getFilesLabel(worker.items.length);
    }, [worker.items.length]);

    const openWorkerDialog = useCallback(
        (folder: FolderItem) => {
            showConfirmationDialog({
                title: "Move files",
                message: `You are about to move ${filesLabel} to ${folder.title}. Are you sure you want to continue?`,
                loadingLabel: `Processing ${filesLabel}`,
                execute: async () => {
                    await worker.processInSeries(async ({ item, report }) => {
                        try {
                            await moveFileToFolder(item.id, folder.id);

                            report.success({
                                title: `${item.name}`,
                                message: "File successfully moved."
                            });
                        } catch (e) {
                            report.error({
                                title: `${item.name}`,
                                message: e.message
                            });
                        }
                    });

                    worker.resetItems();

                    showResultsDialog({
                        results: worker.results,
                        title: "Move files",
                        message: "Finished moving files! See full report below:"
                    });
                }
            });
        },
        [filesLabel]
    );

    const openMoveDialog = () =>
        showMoveDialog({
            title: "Select folder",
            message: "Select a new location for selected files:",
            loadingLabel: `Processing ${filesLabel}`,
            acceptLabel: `Move`,
            focusedFolderId: currentFolderId || ROOT_FOLDER,
            async onAccept({ folder }) {
                openWorkerDialog(folder);
            }
        });

    return (
        <IconButton
            icon={<MoveIcon />}
            onAction={openMoveDialog}
            label={`Move ${filesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
});

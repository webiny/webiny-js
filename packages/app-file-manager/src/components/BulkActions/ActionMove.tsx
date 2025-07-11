import React, { useCallback, useMemo } from "react";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { observer } from "mobx-react-lite";
import { useMoveToFolderDialog, useNavigateFolder } from "@webiny/app-aco";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { FileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";
import { getFilesLabel } from "~/components/BulkActions/BulkActions";
import { ROOT_FOLDER } from "~/constants";
import { type NodeDto, Tooltip } from "@webiny/admin-ui";

export const ActionMove = observer(() => {
    const { moveFileToFolder } = useFileManagerView();
    const { currentFolderId } = useNavigateFolder();

    const { useWorker, useButtons, useDialog } = FileManagerViewConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();
    const { showDialog: showMoveDialog } = useMoveToFolderDialog();

    const filesLabel = useMemo(() => {
        return getFilesLabel(worker.items.length);
    }, [worker.items.length]);

    const openWorkerDialog = useCallback(
        (folder: NodeDto) => {
            showConfirmationDialog({
                title: "Move files",
                message: `You are about to move ${filesLabel} to ${folder.label}. Are you sure you want to continue?`,
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
        <Tooltip
            side={"bottom"}
            content={`Move ${filesLabel}`}
            trigger={
                <ButtonDefault icon={<MoveIcon />} onAction={openMoveDialog} size={"sm"}>
                    {`Move`}
                </ButtonDefault>
            }
        />
    );
});

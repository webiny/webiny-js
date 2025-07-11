import React, { useCallback, useMemo } from "react";
import { ReactComponent as MoveIcon } from "@webiny/icons/drive_file_move.svg";
import { useMoveToFolderDialog, useNavigateFolder, useRecords } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { PageListConfig } from "~/admin/config/pages";
import { ROOT_FOLDER } from "~/admin/constants";
import { getPagesLabel } from "~/admin/components/BulkActions/BulkActions";
import type { NodeDto } from "@webiny/admin-ui";

export const ActionMove = observer(() => {
    const { moveRecord } = useRecords();
    const { currentFolderId } = useNavigateFolder();

    const { useWorker, useButtons, useDialog } = PageListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();
    const { showDialog: showMoveDialog } = useMoveToFolderDialog();

    const pagesLabel = useMemo(() => {
        return getPagesLabel(worker.items.length);
    }, [worker.items.length]);

    const openWorkerDialog = useCallback(
        (folder: NodeDto) => {
            showConfirmationDialog({
                title: "Move pages",
                message: `You are about to move ${pagesLabel} to ${folder.label}. Are you sure you want to continue?`,
                loadingLabel: `Processing ${pagesLabel}`,
                execute: async () => {
                    await worker.processInSeries(async ({ item, report }) => {
                        try {
                            await moveRecord({
                                id: item.data.pid,
                                location: {
                                    folderId: folder.id
                                }
                            });

                            report.success({
                                title: `${item.title}`,
                                message: "Page successfully moved."
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
                        title: "Move pages",
                        message: "Finished moving pages! See full report below:"
                    });
                }
            });
        },
        [pagesLabel]
    );

    const openMovePagesDialog = () =>
        showMoveDialog({
            title: "Select folder",
            message: "Select a new location for selected pages:",
            loadingLabel: `Processing ${pagesLabel}`,
            acceptLabel: `Move`,
            focusedFolderId: currentFolderId || ROOT_FOLDER,
            async onAccept({ folder }) {
                openWorkerDialog(folder);
            }
        });

    return (
        <IconButton
            icon={<MoveIcon />}
            onAction={openMovePagesDialog}
            label={`Move ${pagesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
});

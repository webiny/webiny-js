import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { useMoveToFolderDialog } from "@webiny/app-aco";
import type { NodeDto } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import {
    BulkActionButton,
    useBulkActionDialog
} from "@webiny/app-admin/components/BulkActions/index.js";
import { ROOT_FOLDER } from "~/admin/constants.js";
import { BulkMoveFeature } from "~/presentation/contentEntries/bulkActions/feature.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";

export const ActionMove = observer(() => {
    const presenter = useContentEntriesPresenter();
    const { presenter: bulkMove } = useFeature(BulkMoveFeature);
    const toast = useToast();
    const { showConfirmationDialog, showResultsDialog } = useBulkActionDialog();
    const { showDialog: showMoveDialog } = useMoveToFolderDialog();

    const selection = presenter.list.vm.selection;
    const currentFolderId = presenter.folders.vm.currentFolderId;
    const selectedItems = presenter.list.vm.rows.filter(row => {
        return selection.selectedIds.has(row.id);
    });

    const openWorkerDialog = useCallback(
        (folder: NodeDto) => {
            showConfirmationDialog({
                title: "Move entries",
                message: `You are about to move ${selection.label} to ${folder.label}. Are you sure you want to continue?`,
                loadingLabel: `Processing ${selection.label}`,
                execute: async () => {
                    await bulkMove.execute(selectedItems, selection.allSelected, folder.id);
                    presenter.list.actions.selection.deselectAll();

                    if (selection.allSelected) {
                        toast.showSuccessToast({
                            title: "Entries will be moved in the background",
                            description: `All entries will be moved to ${folder.label}. This process will be carried out in the background and may take some time. You can safely navigate away from this page while the process is running.`,
                            dismissible: true,
                            duration: Infinity
                        });

                        return;
                    }

                    showResultsDialog({
                        results: bulkMove.vm.results,
                        title: "Move entries",
                        message: "Finished moving entries! See full report below:"
                    });
                }
            });
        },
        [selection.label, selection.allSelected, selectedItems]
    );

    const openMoveEntriesDialog = () =>
        showMoveDialog({
            title: "Select folder",
            message: "Select a new location for selected entries:",
            loadingLabel: `Processing ${selection.label}`,
            acceptLabel: "Move",
            focusedFolderId: currentFolderId || ROOT_FOLDER,
            async onAccept({ folder }) {
                openWorkerDialog(folder);
            }
        });

    return (
        <BulkActionButton
            text="Move"
            tooltipContent={`Move ${selection.label}`}
            icon={<MoveIcon />}
            onClick={openMoveEntriesDialog}
        />
    );
});

import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import type { NodeDto } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { useMoveToFolderDialog } from "@webiny/app-aco";
import {
    BulkActionButton,
    useBulkActionDialog
} from "@webiny/app-admin/components/BulkActions/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { usePageListPresenter } from "../../PageListPresenterProvider.js";
import { BulkMoveFeature } from "~/presentation/pages/bulkActions/feature.js";

export const BulkActionMovePage = observer(() => {
    const presenter = usePageListPresenter();
    const { presenter: bulkMove } = useFeature(BulkMoveFeature);
    const { showConfirmationDialog, showResultsDialog } = useBulkActionDialog();
    const { showDialog: showMoveDialog } = useMoveToFolderDialog();

    const selection = presenter.list.vm.selection;
    const currentFolderId = presenter.folders.vm.currentFolderId;
    const selectedItems = presenter.list.vm.rows.filter(row => {
        return selection.selectedIds.has(row.entryId);
    });

    const openWorkerDialog = useCallback(
        (folder: NodeDto) => {
            showConfirmationDialog({
                title: "Move pages",
                message: `You are about to move ${selection.label} to ${folder.label}. Are you sure you want to continue?`,
                loadingLabel: `Processing ${selection.label}`,
                execute: async () => {
                    await bulkMove.execute(selectedItems, folder.id);
                    presenter.list.actions.selection.deselectAll();

                    showResultsDialog({
                        results: bulkMove.vm.results,
                        title: "Move pages",
                        message: "Finished moving pages! See full report below:"
                    });
                }
            });
        },
        [selection.label, selection.allSelected, selectedItems]
    );

    const openMoveDialog = () =>
        showMoveDialog({
            title: "Select folder",
            message: "Select a new location for selected pages:",
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
            onClick={openMoveDialog}
        />
    );
});

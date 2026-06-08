import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as MoveIcon } from "@webiny/icons/exit_to_app.svg";
import { useMoveToFolderDialog } from "@webiny/app-aco";
import { type NodeDto, Tooltip } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { ROOT_FOLDER } from "~/admin/constants.js";
import { getEntriesLabel } from "~/admin/components/ContentEntries/BulkActions/BulkActions.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { BulkMoveFeature } from "~/presentation/contentEntries/bulkActions/feature.js";

export const ActionMove = observer(() => {
    const presenter = useContentEntriesPresenter();
    const { presenter: bulkMove } = useFeature(BulkMoveFeature);
    const toast = useToast();

    const { useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const { showConfirmationDialog, showResultsDialog } = useDialog();
    const { showDialog: showMoveDialog } = useMoveToFolderDialog();

    const entriesLabel = getEntriesLabel();
    const currentFolderId = presenter.folders.vm.currentFolderId;
    const allSelected = presenter.list.vm.selection.allSelected;
    const selectedItems = presenter.list.vm.rows.filter(row => {
        return presenter.list.vm.selection.selectedIds.has(row.id);
    });

    const openWorkerDialog = useCallback(
        (folder: NodeDto) => {
            showConfirmationDialog({
                title: "Move entries",
                message: `You are about to move ${entriesLabel} to ${folder.label}. Are you sure you want to continue?`,
                loadingLabel: `Processing ${entriesLabel}`,
                execute: async () => {
                    await bulkMove.execute(selectedItems, allSelected, folder.id);
                    presenter.list.actions.selection.deselectAll();

                    if (allSelected) {
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
        [entriesLabel, allSelected, selectedItems]
    );

    const openMoveEntriesDialog = () =>
        showMoveDialog({
            title: "Select folder",
            message: "Select a new location for selected entries:",
            loadingLabel: `Processing ${entriesLabel}`,
            acceptLabel: "Move",
            focusedFolderId: currentFolderId || ROOT_FOLDER,
            async onAccept({ folder }) {
                openWorkerDialog(folder);
            }
        });

    return (
        <Tooltip
            side={"bottom"}
            content={`Move ${entriesLabel}`}
            trigger={
                <ButtonDefault icon={<MoveIcon />} onAction={openMoveEntriesDialog} size={"sm"}>
                    {"Move"}
                </ButtonDefault>
            }
        />
    );
});

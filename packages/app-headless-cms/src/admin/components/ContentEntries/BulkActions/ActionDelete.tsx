import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { BulkDeleteFeature } from "~/presentation/contentEntries/bulkActions/feature.js";
import {
    BulkActionButton,
    useBulkActionDialog
} from "@webiny/app-admin/components/BulkActions/index.js";

export const ActionDelete = observer(() => {
    const toast = useToast();
    const presenter = useContentEntriesPresenter();
    const { showConfirmationDialog, showResultsDialog } = useBulkActionDialog();
    const { presenter: bulkDelete } = useFeature(BulkDeleteFeature);

    const selection = presenter.list.vm.selection;
    const selectedItems = presenter.list.vm.rows.filter(row => {
        return selection.selectedIds.has(row.id);
    });

    const openDeleteEntriesDialog = () =>
        showConfirmationDialog({
            title: "Trash entries",
            message: `You are about to move ${selection.label} to trash. Are you sure you want to continue?`,
            loadingLabel: `Processing ${selection.label}`,
            execute: async () => {
                await bulkDelete.execute(selectedItems, selection.allSelected);
                presenter.list.actions.selection.deselectAll();

                if (selection.allSelected) {
                    toast.showSuccessToast({
                        title: "Entries will be trashed in the background",
                        description:
                            "All entries will be moved to trash. This process will be carried out in the background and may take some time. You can safely navigate away from this page while the process is running.",
                        dismissible: true,
                        duration: Infinity
                    });
                    return;
                }

                showResultsDialog({
                    results: bulkDelete.vm.results,
                    title: "Trash entries",
                    message: "Finished moving entries to trash! See full report below:"
                });
            }
        });

    return (
        <BulkActionButton
            text="Trash"
            tooltipContent={`Trash ${selection.label}`}
            icon={<DeleteIcon />}
            onClick={openDeleteEntriesDialog}
        />
    );
});

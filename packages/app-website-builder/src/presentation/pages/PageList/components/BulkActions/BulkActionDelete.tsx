import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { useFeature } from "@webiny/app";
import {
    BulkActionButton,
    useBulkActionDialog
} from "@webiny/app-admin/components/BulkActions/index.js";
import { usePageListPresenter } from "../../PageListPresenterProvider.js";
import { BulkDeleteFeature } from "~/presentation/pages/bulkActions/feature.js";

export const BulkActionDelete = observer(() => {
    const presenter = usePageListPresenter();
    const { showConfirmationDialog, showResultsDialog } = useBulkActionDialog();
    const { presenter: bulkDelete } = useFeature(BulkDeleteFeature);

    const selection = presenter.list.vm.selection;
    const selectedItems = presenter.list.vm.rows.filter(row => {
        return selection.selectedIds.has(row.entryId);
    });

    const openDeleteDialog = () =>
        showConfirmationDialog({
            title: "Delete pages",
            message: `You are about to delete ${selection.label}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${selection.label}`,
            execute: async () => {
                await bulkDelete.execute(selectedItems);
                presenter.list.actions.selection.deselectAll();

                showResultsDialog({
                    results: bulkDelete.vm.results,
                    title: "Delete pages",
                    message: "Finished deleting pages! See full report below:"
                });
            }
        });

    return (
        <BulkActionButton
            text="Delete"
            tooltipContent={`Delete ${selection.label}`}
            icon={<DeleteIcon />}
            onClick={openDeleteDialog}
        />
    );
});

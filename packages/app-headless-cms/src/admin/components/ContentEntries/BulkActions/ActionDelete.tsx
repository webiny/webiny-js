import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { Tooltip } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { getEntriesLabel } from "~/admin/components/ContentEntries/BulkActions/BulkActions.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { BulkDeleteFeature } from "~/presentation/contentEntries/bulkActions/feature.js";

const { useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;

export const ActionDelete = observer(() => {
    const presenter = useContentEntriesPresenter();
    const { presenter: bulkDelete } = useFeature(BulkDeleteFeature);
    const toast = useToast();
    const { ButtonDefault } = useButtons();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = getEntriesLabel();
    const allSelected = presenter.list.vm.selection.allSelected;
    const selectedItems = presenter.list.vm.rows.filter(row => {
        return presenter.list.vm.selection.selectedIds.has(row.id);
    });

    const openDeleteEntriesDialog = () =>
        showConfirmationDialog({
            title: "Trash entries",
            message: `You are about to move ${entriesLabel} to trash. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                await bulkDelete.execute(selectedItems, allSelected);
                presenter.list.actions.selection.deselectAll();

                if (allSelected) {
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
        <Tooltip
            side={"bottom"}
            content={`Trash ${entriesLabel}`}
            trigger={
                <ButtonDefault icon={<DeleteIcon />} onAction={openDeleteEntriesDialog} size={"sm"}>
                    {"Trash"}
                </ButtonDefault>
            }
        />
    );
});

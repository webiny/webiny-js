import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as DuplicateIcon } from "@webiny/icons/library_add.svg";
import { useFeature } from "@webiny/app";
import {
    BulkActionButton,
    useBulkActionDialog
} from "@webiny/app-admin/components/BulkActions/index.js";
import { usePageListPresenter } from "../../PageListPresenterProvider.js";
import { BulkDuplicateFeature } from "~/presentation/pages/bulkActions/feature.js";

export const BulkActionDuplicate = observer(() => {
    const presenter = usePageListPresenter();
    const { showConfirmationDialog, showResultsDialog } = useBulkActionDialog();
    const { presenter: bulkDuplicate } = useFeature(BulkDuplicateFeature);

    const selection = presenter.list.vm.selection;
    const selectedItems = presenter.list.vm.rows.filter(row => {
        return selection.selectedIds.has(row.entryId);
    });

    const openDuplicateDialog = () =>
        showConfirmationDialog({
            title: "Duplicate pages",
            message: `You are about to duplicate ${selection.label}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${selection.label}`,
            execute: async () => {
                await bulkDuplicate.execute(selectedItems);
                presenter.list.actions.selection.deselectAll();

                showResultsDialog({
                    results: bulkDuplicate.vm.results,
                    title: "Duplicate pages",
                    message: "Finished duplicating pages! See full report below:"
                });
            }
        });

    return (
        <BulkActionButton
            text="Duplicate"
            tooltipContent={`Duplicate ${selection.label}`}
            icon={<DuplicateIcon />}
            onClick={openDuplicateDialog}
        />
    );
});

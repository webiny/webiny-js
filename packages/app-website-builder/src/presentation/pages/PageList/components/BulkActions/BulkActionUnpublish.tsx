import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as UnpublishIcon } from "@webiny/icons/visibility_off.svg";
import { useFeature } from "@webiny/app";
import {
    BulkActionButton,
    useBulkActionDialog
} from "@webiny/app-admin/components/BulkActions/index.js";
import { usePageListPresenter } from "../../PageListPresenterProvider.js";
import { BulkUnpublishFeature } from "~/presentation/pages/bulkActions/feature.js";

export const BulkActionUnpublish = observer(() => {
    const presenter = usePageListPresenter();
    const { presenter: bulkUnpublish } = useFeature(BulkUnpublishFeature);
    const { showConfirmationDialog, showResultsDialog } = useBulkActionDialog();

    const selection = presenter.list.vm.selection;
    const selectedItems = presenter.list.vm.rows.filter(row => {
        return selection.selectedIds.has(row.entryId);
    });

    const openUnpublishDialog = () =>
        showConfirmationDialog({
            title: "Unpublish pages",
            message: `You are about to unpublish ${selection.label}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${selection.label}`,
            execute: async () => {
                await bulkUnpublish.execute(selectedItems);
                presenter.list.actions.selection.deselectAll();

                showResultsDialog({
                    results: bulkUnpublish.vm.results,
                    title: "Unpublish pages",
                    message: "Finished unpublishing pages! See full report below:"
                });
            }
        });

    return (
        <BulkActionButton
            text="Unpublish"
            tooltipContent={`Unpublish ${selection.label}`}
            icon={<UnpublishIcon />}
            onClick={openUnpublishDialog}
        />
    );
});

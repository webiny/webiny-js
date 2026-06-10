import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as UnpublishIcon } from "@webiny/icons/visibility_off.svg";
import { useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import {
    BulkActionButton,
    useBulkActionDialog
} from "@webiny/app-admin/components/BulkActions/index.js";
import { usePermission } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { BulkUnpublishFeature } from "~/presentation/contentEntries/bulkActions/feature.js";

export const ActionUnpublish = observer(() => {
    const { canUnpublish } = usePermission();
    const presenter = useContentEntriesPresenter();
    const { presenter: bulkUnpublish } = useFeature(BulkUnpublishFeature);
    const toast = useToast();
    const { showConfirmationDialog, showResultsDialog } = useBulkActionDialog();

    const selection = presenter.list.vm.selection;
    const selectedItems = presenter.list.vm.rows.filter(row => {
        return selection.selectedIds.has(row.id);
    });

    const openUnpublishEntriesDialog = () => {
        showConfirmationDialog({
            title: "Unpublish entries",
            message: `You are about to unpublish ${selection.label}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${selection.label}`,
            execute: async () => {
                await bulkUnpublish.execute(selectedItems, selection.allSelected);
                presenter.list.actions.selection.deselectAll();

                if (selection.allSelected) {
                    toast.showSuccessToast({
                        title: "Entries will be unpublished in the background",
                        description:
                            "All entries will be unpublished. This process will be carried out in the background and may take some time. You can safely navigate away from this page while the process is running.",
                        dismissible: true,
                        duration: Infinity
                    });

                    return;
                }

                showResultsDialog({
                    results: bulkUnpublish.vm.results,
                    title: "Unpublish entries",
                    message: "Finished unpublishing entries! See full report below:"
                });
            }
        });
    };

    if (!canUnpublish("cms.contentEntry")) {
        return null;
    }

    return (
        <BulkActionButton
            text="Unpublish"
            tooltipContent={`Unpublish ${selection.label}`}
            icon={<UnpublishIcon />}
            onClick={openUnpublishEntriesDialog}
        />
    );
});

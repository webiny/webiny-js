import React from "react";
import { observer } from "mobx-react-lite";
import { useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { ReactComponent as PublishIcon } from "@webiny/icons/visibility.svg";
import { BulkActionButton, useBulkActionDialog } from "@webiny/app-admin/components/BulkActions/index.js";
import { usePermission } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { BulkPublishFeature } from "~/presentation/contentEntries/bulkActions/feature.js";

export const ActionPublish = observer(() => {
    const { canPublish } = usePermission();
    const presenter = useContentEntriesPresenter();
    const toast = useToast();
    const { showConfirmationDialog, showResultsDialog } = useBulkActionDialog();
    const { presenter: bulkPublish } = useFeature(BulkPublishFeature);

    const selection = presenter.list.vm.selection;
    const selectedItems = presenter.list.vm.rows.filter(row => {
        return selection.selectedIds.has(row.id);
    });

    const openPublishEntriesDialog = () =>
        showConfirmationDialog({
            title: "Publish entries",
            message: `You are about to publish ${selection.label}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${selection.label}`,
            execute: async () => {
                await bulkPublish.execute(selectedItems, selection.allSelected);
                presenter.list.actions.selection.deselectAll();

                if (selection.allSelected) {
                    toast.showSuccessToast({
                        title: "Publishing of entries started in the background",
                        description:
                            "All entries will be published. This process will be carried out in the background and may take some time. You can safely navigate away from this page while the process is running.",
                        dismissible: true,
                        duration: Infinity
                    });
                    return;
                }

                showResultsDialog({
                    results: bulkPublish.vm.results,
                    title: "Publish entries",
                    message: "Finished publishing entries! See full report below:"
                });
            }
        });

    if (!canPublish("cms.contentEntry")) {
        return null;
    }

    return (
        <BulkActionButton
            text="Publish"
            tooltipContent={`Publish ${selection.label}`}
            icon={<PublishIcon />}
            onClick={openPublishEntriesDialog}
        />
    );
});

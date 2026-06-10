import React from "react";
import { observer } from "mobx-react-lite";
import { Tooltip } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { ReactComponent as PublishIcon } from "@webiny/icons/visibility.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { usePermission } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { BulkPublishFeature } from "~/presentation/contentEntries/bulkActions/feature.js";

export const ActionPublish = observer(() => {
    const { canPublish } = usePermission();
    const presenter = useContentEntriesPresenter();
    const { presenter: bulkPublish } = useFeature(BulkPublishFeature);
    const toast = useToast();

    const { useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = presenter.list.vm.selection.label;
    const listVm = presenter.list.vm;

    const allSelected = listVm.selection.allSelected;
    const selectedItems = listVm.rows.filter(row => {
        return listVm.selection.selectedIds.has(row.id);
    });

    const openPublishEntriesDialog = () =>
        showConfirmationDialog({
            title: "Publish entries",
            message: `You are about to publish ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                await bulkPublish.execute(selectedItems, allSelected);
                presenter.list.actions.selection.deselectAll();

                if (allSelected) {
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
        <Tooltip
            side={"bottom"}
            content={`Publish ${entriesLabel}`}
            trigger={
                <ButtonDefault
                    icon={<PublishIcon />}
                    onAction={openPublishEntriesDialog}
                    size={"sm"}
                >
                    Publish
                </ButtonDefault>
            }
        />
    );
});

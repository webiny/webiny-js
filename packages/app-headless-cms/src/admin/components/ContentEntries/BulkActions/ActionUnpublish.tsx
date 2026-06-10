import React from "react";
import { ReactComponent as UnpublishIcon } from "@webiny/icons/visibility_off.svg";
import { observer } from "mobx-react-lite";
import { Tooltip } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { usePermission } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { BulkUnpublishFeature } from "~/presentation/contentEntries/bulkActions/feature.js";

export const ActionUnpublish = observer(() => {
    const { canUnpublish } = usePermission();
    const presenter = useContentEntriesPresenter();
    const { presenter: bulkUnpublish } = useFeature(BulkUnpublishFeature);
    const toast = useToast();

    const { useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = presenter.list.vm.selection.label;
    const allSelected = presenter.list.vm.selection.allSelected;
    const selectedItems = presenter.list.vm.rows.filter(row => {
        return presenter.list.vm.selection.selectedIds.has(row.id);
    });

    const openUnpublishEntriesDialog = () => {
        showConfirmationDialog({
            title: "Unpublish entries",
            message: `You are about to unpublish ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                await bulkUnpublish.execute(selectedItems, allSelected);
                presenter.list.actions.selection.deselectAll();

                if (allSelected) {
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
        <Tooltip
            side={"bottom"}
            content={`Unpublish ${entriesLabel}`}
            trigger={
                <ButtonDefault
                    icon={<UnpublishIcon />}
                    onAction={openUnpublishEntriesDialog}
                    size={"sm"}
                >
                    {"Unpublish"}
                </ButtonDefault>
            }
        />
    );
});

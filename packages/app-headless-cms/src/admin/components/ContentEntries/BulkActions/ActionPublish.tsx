import React from "react";
import { ReactComponent as PublishIcon } from "@webiny/icons/visibility.svg";
import { observer } from "mobx-react-lite";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { usePermission, useCms, useModel } from "~/admin/hooks/index.js";
import { getEntriesLabel } from "~/admin/components/ContentEntries/BulkActions/BulkActions.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { useSnackbar } from "@webiny/app-admin";
import { Tooltip } from "@webiny/admin-ui";

export const ActionPublish = observer(() => {
    const { model } = useModel();
    const { canPublish } = usePermission();
    const { publishEntryRevision } = useCms();
    const presenter = useContentEntriesPresenter();
    const { showSnackbar } = useSnackbar();

    const { useWorker, useButtons, useDialog } = ContentEntryListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = getEntriesLabel();

    const openPublishEntriesDialog = () =>
        showConfirmationDialog({
            title: "Publish entries",
            message: `You are about to publish ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                if (worker.isSelectedAll) {
                    await worker.processInBulk({
                        action: "Publish"
                    });
                    worker.resetItems();
                    showSnackbar(
                        "All entries will be published. This process will be carried out in the background and may take some time. You can safely navigate away from this page while the process is running.",
                        {
                            dismissIcon: true,
                            timeout: -1
                        }
                    );
                    return;
                }

                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const response = await publishEntryRevision({ model, id: item.id });

                        const { error } = response;

                        if (error) {
                            throw new Error(
                                error.message || "Unknown error while publishing the entry"
                            );
                        }

                        report.success({
                            title: `${item.meta.title}`,
                            message: "Entry successfully published."
                        });
                    } catch (e) {
                        report.error({
                            title: `${item.meta.title}`,
                            message: e.message
                        });
                    }
                });

                worker.resetItems();
                await presenter.listPresenter.actions.refresh();

                showResultsDialog({
                    results: worker.results,
                    title: "Publish entries",
                    message: "Finished publishing entries! See full report below:"
                });
            }
        });

    if (!canPublish("cms.contentEntry")) {
        console.log("You don't have permissions to publish entries.");
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
                    {"Publish"}
                </ButtonDefault>
            }
        />
    );
});

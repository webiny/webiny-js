import React, { useMemo } from "react";
import { ReactComponent as PublishIcon } from "@material-design-icons/svg/outlined/publish.svg";
import { useRecords } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { PageListConfig } from "~/admin/config/pages";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { getPagesLabel } from "~/admin/components/BulkActions/BulkActions";

export const ActionPublish = observer(() => {
    const { publishPage, client } = useAdminPageBuilder();
    const { getRecord } = useRecords();

    const { useWorker, useButtons, useDialog } = PageListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const pagesLabel = useMemo(() => {
        return getPagesLabel(worker.items.length);
    }, [worker.items.length]);

    const openPublishPagesDialog = () =>
        showConfirmationDialog({
            title: "Publish pages",
            message: `You are about to publish ${pagesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${pagesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        const response = await publishPage(
                            { id: item.data.id },
                            {
                                client: client
                            }
                        );

                        const { error, page } = response;

                        if (error) {
                            throw new Error(
                                error.message || "Unknown error while publishing the pages"
                            );
                        }

                        await getRecord(page.id);

                        report.success({
                            title: `${item.data.title}`,
                            message: "Page successfully published."
                        });
                    } catch (e) {
                        report.error({
                            title: `${item.data.title}`,
                            message: e.message
                        });
                    }
                });

                worker.resetItems();

                showResultsDialog({
                    results: worker.results,
                    title: "Publish pages",
                    message: "Finished publishing pages! See full report below:"
                });
            }
        });

    return (
        <IconButton
            icon={<PublishIcon />}
            onAction={openPublishPagesDialog}
            label={`Publish ${pagesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
});

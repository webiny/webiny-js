import React, { useMemo } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as PublishIcon } from "@webiny/icons/visibility.svg";
import { observer } from "mobx-react-lite";
import { getPagesLabel } from "~/DocumentList/components/BulkActions/BulkActions.js";
import { usePublishPage } from "~/features/pages/index.js";
import { PageListConfig } from "~/configs/index.js";

export const BulkActionPublish = observer(() => {
    const { useWorker, useButtons, useDialog } = PageListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();

    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const { publishPage } = usePublishPage();

    const pagesLabel = useMemo(() => {
        return getPagesLabel(worker.items.length);
    }, [worker.items.length]);

    const openPublishDialog = () =>
        showConfirmationDialog({
            title: "Publish pages",
            message: `You are about to publish ${pagesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${pagesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        await publishPage({ id: item.id });

                        report.success({
                            title: item.properties.title,
                            message: "Page successfully published."
                        });
                    } catch (e) {
                        report.error({
                            title: item.properties.title,
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
        <Tooltip
            side={"bottom"}
            content={`Publish ${pagesLabel}`}
            trigger={
                <ButtonDefault icon={<PublishIcon />} onAction={openPublishDialog} size={"sm"}>
                    {`Publish`}
                </ButtonDefault>
            }
        />
    );
});

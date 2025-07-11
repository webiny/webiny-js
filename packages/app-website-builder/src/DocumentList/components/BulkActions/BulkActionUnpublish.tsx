import React, { useMemo } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as UnpublishIcon } from "@webiny/icons/visibility_off.svg";
import { observer } from "mobx-react-lite";
import { getPagesLabel } from "~/DocumentList/components/BulkActions/BulkActions.js";
import { useUnpublishPage } from "~/features/pages/index.js";
import { PageListConfig } from "~/configs/index.js";

export const BulkActionUnpublish = observer(() => {
    const { useWorker, useButtons, useDialog } = PageListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();

    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const { unpublishPage } = useUnpublishPage();

    const pagesLabel = useMemo(() => {
        return getPagesLabel(worker.items.length);
    }, [worker.items.length]);

    const openUnpublishDialog = () =>
        showConfirmationDialog({
            title: "Unpublish pages",
            message: `You are about to unpublish ${pagesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${pagesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        await unpublishPage({ id: item.id });

                        report.success({
                            title: item.properties.title,
                            message: "Page successfully unpublished."
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
                    title: "Unpublish pages",
                    message: "Finished unpublishing pages! See full report below:"
                });
            }
        });

    return (
        <Tooltip
            side={"bottom"}
            content={`Unpublish ${pagesLabel}`}
            trigger={
                <ButtonDefault icon={<UnpublishIcon />} onAction={openUnpublishDialog} size={"sm"}>
                    {`Unpublish`}
                </ButtonDefault>
            }
        />
    );
});

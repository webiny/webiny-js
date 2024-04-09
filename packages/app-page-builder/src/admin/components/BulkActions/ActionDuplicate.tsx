import React, { useMemo } from "react";
import { ReactComponent as Duplicate } from "@material-design-icons/svg/outlined/library_add.svg";
import { useRecords } from "@webiny/app-aco";
import { observer } from "mobx-react-lite";
import { PageListConfig } from "~/admin/config/pages";
import { getPagesLabel } from "~/admin/components/BulkActions/BulkActions";
import { useDuplicatePageCase } from "~/admin/views/Pages/hooks/useDuplicatePage";
import { makeDecoratable } from "@webiny/react-composition";

export const ActionDuplicate = makeDecoratable(
    "BulkActionDuplicate",
    observer(() => {
        const { duplicatePage } = useDuplicatePageCase();
        const { getRecord } = useRecords();

        const { useWorker, useButtons, useDialog } = PageListConfig.Browser.BulkAction;
        const { IconButton } = useButtons();
        const worker = useWorker();
        const { showConfirmationDialog, showResultsDialog } = useDialog();

        const pagesLabel = useMemo(() => {
            return getPagesLabel(worker.items.length);
        }, [worker.items.length]);

        const openDuplicatePagesDialog = () =>
            showConfirmationDialog({
                title: "Duplicate pages",
                message: `You are about to duplicate ${pagesLabel}. Are you sure you want to continue?`,
                loadingLabel: `Processing ${pagesLabel}`,
                execute: async () => {
                    await worker.processInSeries(async ({ item, report }) => {
                        try {
                            const data = await duplicatePage({ page: item });

                            await getRecord(data.pid);

                            report.success({
                                title: `${item.data.title}`,
                                message: "Page successfully duplicated."
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
                        title: "Duplicate pages",
                        message: "Finished duplicating pages! See full report below:"
                    });
                }
            });

        return (
            <IconButton
                icon={<Duplicate />}
                onAction={openDuplicatePagesDialog}
                label={`Duplicate ${pagesLabel}`}
                tooltipPlacement={"bottom"}
            />
        );
    })
);

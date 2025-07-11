import React, { useMemo } from "react";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { observer } from "mobx-react-lite";
import { getPagesLabel } from "~/DocumentList/components/BulkActions/BulkActions.js";
import { useDeletePage } from "~/features/pages/index.js";
import { PageListConfig } from "~/configs/index.js";

export const BulkActionDelete = observer(() => {
    const { useWorker, useButtons, useDialog } = PageListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();

    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const { deletePage } = useDeletePage();

    const pagesLabel = useMemo(() => {
        return getPagesLabel(worker.items.length);
    }, [worker.items.length]);

    const openDeleteDialog = () =>
        showConfirmationDialog({
            title: "Delete pages",
            message: `You are about to delete ${pagesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${pagesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        await deletePage({ id: item.id });

                        report.success({
                            title: item.properties.title,
                            message: "Page successfully deleted."
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
                    title: "Delete pages",
                    message: "Finished deleting pages! See full report below:"
                });
            }
        });

    return (
        <Tooltip
            side={"bottom"}
            content={`Delete ${pagesLabel}`}
            trigger={
                <ButtonDefault icon={<DeleteIcon />} onAction={openDeleteDialog} size={"sm"}>
                    {`Delete`}
                </ButtonDefault>
            }
        />
    );
});

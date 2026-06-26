import React, { useMemo } from "react";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { observer } from "mobx-react-lite";
import { useSnackbar } from "~/index.js";
import { TrashBinListConfig } from "../../configs/index.js";
import { useTrashBinPresenter } from "../../hooks/index.js";
import { Tooltip } from "@webiny/admin-ui";

const getEntriesLabel = (count: number, isSelectedAll: boolean): string => {
    if (isSelectedAll) {
        return "all entries";
    }
    return `${count} ${count === 1 ? "item" : "items"}`;
};

export const BulkActionsDeleteItems = observer(() => {
    const { actions } = useTrashBinPresenter();
    const { showSnackbar } = useSnackbar();

    const { useWorker, useButtons, useDialog } = TrashBinListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = useMemo(() => {
        return getEntriesLabel(worker.items.length, worker.isSelectedAll);
    }, [worker.items.length, worker.isSelectedAll]);

    const openDeleteEntriesDialog = () =>
        showConfirmationDialog({
            title: "Delete items",
            message: `You are about to permanently delete ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                if (worker.isSelectedAll) {
                    await worker.processInBulk(params => actions.bulkDelete(params));
                    worker.resetItems();
                    showSnackbar(
                        "All items will be permanently deleted. This process will be carried out in the background and may take some time. You can safely navigate away from this page while the process is running.",
                        {
                            dismissIcon: true,
                            timeout: -1
                        }
                    );
                    return;
                }

                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        await actions.deleteItem(item.id);
                        report.success({
                            title: `${item.title}`,
                            message: "Item successfully deleted."
                        });
                    } catch (e: any) {
                        report.error({
                            title: `${item.title}`,
                            message: e.message || "Unknown error while deleting the item."
                        });
                    }
                });

                worker.resetItems();
                await actions.refresh();

                showResultsDialog({
                    results: worker.results,
                    title: "Delete items",
                    message: "Finished deleting items! See full report below:"
                });
            }
        });

    return (
        <Tooltip
            side={"bottom"}
            content={`Delete ${entriesLabel}`}
            trigger={
                <ButtonDefault icon={<DeleteIcon />} onAction={openDeleteEntriesDialog} size={"sm"}>
                    {"Delete"}
                </ButtonDefault>
            }
        />
    );
});

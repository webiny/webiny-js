import React, { useMemo } from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { observer } from "mobx-react-lite";
import { TrashBinListConfig } from "~/Presentation/configs";
import { useTrashBin } from "~/Presentation/hooks";
import { getEntriesLabel } from "../BulkActions";

export const BulkActionsDeleteItems = observer(() => {
    const { deleteItem } = useTrashBin();

    const { useWorker, useButtons, useDialog } = TrashBinListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = useMemo(() => {
        return getEntriesLabel(worker.items.length);
    }, [worker.items.length]);

    const openDeleteEntriesDialog = () =>
        showConfirmationDialog({
            title: "Delete items",
            message: `You are about to permanent delete ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        await deleteItem(item.id);
                        report.success({
                            title: `${item.title}`,
                            message: "Item successfully deleted."
                        });
                    } catch (e) {
                        report.error({
                            title: `${item.title}`,
                            message: e.message || "Unknown error while deleting the item"
                        });
                    }
                });

                worker.resetItems();

                showResultsDialog({
                    results: worker.results,
                    title: "Delete items",
                    message: "Finished deleting items! See full report below:"
                });
            }
        });

    return (
        <IconButton
            icon={<DeleteIcon />}
            onAction={openDeleteEntriesDialog}
            label={`Delete ${entriesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
});

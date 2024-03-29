import React, { useMemo } from "react";
import { ReactComponent as RestoreIcon } from "@material-design-icons/svg/outlined/restore.svg";
import { observer } from "mobx-react-lite";
import { TrashBinListConfig } from "~/Presentation/configs";
import { useTrashBin } from "~/Presentation/hooks";
import { getEntriesLabel } from "../BulkActions";

export const BulkActionsRestoreItems = observer(() => {
    const { restoreItem } = useTrashBin();

    const { useWorker, useButtons, useDialog } = TrashBinListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog } = useDialog();

    const entriesLabel = useMemo(() => {
        return getEntriesLabel(worker.items.length);
    }, [worker.items.length]);

    const openRestoreEntriesDialog = () =>
        showConfirmationDialog({
            title: "Restore items",
            message: `You are about to restore ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        await restoreItem(item.id);
                        report.success({
                            title: `${item.title}`,
                            message: "Item successfully restored."
                        });
                    } catch (e) {
                        report.error({
                            title: `${item.title}`,
                            message: e.message || "Unknown error while restoring the item."
                        });
                    }
                });

                worker.resetItems();

                showResultsDialog({
                    results: worker.results,
                    title: "Restore items",
                    message: "Finished restoring items! See full report below:"
                });
            }
        });

    return (
        <IconButton
            icon={<RestoreIcon />}
            onAction={openRestoreEntriesDialog}
            label={`Restore ${entriesLabel}`}
            tooltipPlacement={"bottom"}
        />
    );
});

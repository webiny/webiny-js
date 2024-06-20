import React, { useCallback, useMemo } from "react";
import { ReactComponent as RestoreIcon } from "@material-design-icons/svg/outlined/restore.svg";
import { observer } from "mobx-react-lite";
import { useSnackbar } from "@webiny/app-admin";
import { TrashBinListConfig } from "~/Presentation/configs";
import { useTrashBin } from "~/Presentation/hooks";
import { getEntriesLabel } from "../BulkActions";
import { RestoreItemsReportMessage } from "~/Presentation/components/BulkActions/RestoreItems/RestoreItemsReportMessage";
import { TrashBinItemDTO } from "~/Domain";

export const BulkActionsRestoreItems = observer(() => {
    const { restoreItem, onItemAfterRestore, getRestoredItemById, restoreBulkAction } =
        useTrashBin();
    const { showSnackbar } = useSnackbar();

    const { useWorker, useButtons, useDialog } = TrashBinListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog, hideResultsDialog } = useDialog();

    const entriesLabel = useMemo(() => {
        return getEntriesLabel(worker.items.length, worker.isSelectedAll);
    }, [worker.items.length, worker.isSelectedAll]);

    const onLocationClick = useCallback(
        async (item: TrashBinItemDTO) => {
            hideResultsDialog();
            await onItemAfterRestore(item);
        },
        [onItemAfterRestore]
    );

    const openRestoreEntriesDialog = () =>
        showConfirmationDialog({
            title: "Restore items",
            message: `You are about to restore ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                if (worker.isSelectedAll) {
                    await worker.processInBulk(restoreBulkAction);
                    worker.resetItems();
                    showSnackbar(
                        "All items will be restored. This process will be carried out in the background and may take some time. You can safely navigate away from this page while the process is running.",
                        {
                            dismissIcon: true,
                            timeout: -1
                        }
                    );
                    return;
                }

                await worker.processInSeries(async ({ item, report }) => {
                    try {
                        await restoreItem(item.id);
                        const restoredItem = await getRestoredItemById(item.id);

                        report.success({
                            title: `${item.title}`,
                            message: restoredItem && (
                                <RestoreItemsReportMessage
                                    onLocationClick={() => onLocationClick(restoredItem)}
                                />
                            )
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

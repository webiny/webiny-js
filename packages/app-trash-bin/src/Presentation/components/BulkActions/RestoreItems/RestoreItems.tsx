import React, { useCallback, useMemo } from "react";
import { ReactComponent as RestoreIcon } from "@material-design-icons/svg/outlined/restore.svg";
import { observer } from "mobx-react-lite";
import { TrashBinListConfig } from "~/Presentation/configs";
import { useTrashBin } from "~/Presentation/hooks";
import { getEntriesLabel } from "../BulkActions";
import { RestoreItemsReportMessage } from "~/Presentation/components/BulkActions/RestoreItems/RestoreItemsReportMessage";
import { TrashBinItemDTO } from "~/Domain";

export const BulkActionsRestoreItems = observer(() => {
    const { restoreItem, onNavigateAfterRestoreItem, getRestoredItemById } = useTrashBin();

    const { useWorker, useButtons, useDialog } = TrashBinListConfig.Browser.BulkAction;
    const { IconButton } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog, hideResultsDialog } = useDialog();

    const entriesLabel = useMemo(() => {
        return getEntriesLabel(worker.items.length);
    }, [worker.items.length]);

    const onLocationClick = useCallback(
        async (item: TrashBinItemDTO) => {
            hideResultsDialog();
            await onNavigateAfterRestoreItem(item);
        },
        [onNavigateAfterRestoreItem]
    );

    const openRestoreEntriesDialog = () =>
        showConfirmationDialog({
            title: "Restore items",
            message: `You are about to restore ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
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

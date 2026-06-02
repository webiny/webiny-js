import React, { useCallback, useMemo } from "react";
import { ReactComponent as RestoreIcon } from "@webiny/icons/restore.svg";
import { observer } from "mobx-react-lite";
import { useSnackbar } from "~/index.js";
import { TrashBinListConfig } from "../../configs/index.js";
import { useTrashBinPresenter } from "../../hooks/index.js";
import { RestoreItemsReportMessage } from "./RestoreItemsReportMessage.js";
import type { TrashBinItem } from "../../abstractions.js";
import { Tooltip } from "@webiny/admin-ui";

const getEntriesLabel = (count: number, isSelectedAll: boolean): string => {
    if (isSelectedAll) {
        return "all entries";
    }
    return `${count} ${count === 1 ? "item" : "items"}`;
};

export const BulkActionsRestoreItems = observer(() => {
    const { actions, onItemAfterRestore } = useTrashBinPresenter();
    const { showSnackbar } = useSnackbar();

    const { useWorker, useButtons, useDialog } = TrashBinListConfig.Browser.BulkAction;
    const { ButtonDefault } = useButtons();
    const worker = useWorker();
    const { showConfirmationDialog, showResultsDialog, hideResultsDialog } = useDialog();

    const entriesLabel = useMemo(() => {
        return getEntriesLabel(worker.items.length, worker.isSelectedAll);
    }, [worker.items.length, worker.isSelectedAll]);

    const onLocationClick = useCallback(
        async (item: TrashBinItem) => {
            hideResultsDialog();
            if (onItemAfterRestore) {
                await onItemAfterRestore(item);
            }
        },
        [onItemAfterRestore, hideResultsDialog]
    );

    const openRestoreEntriesDialog = () =>
        showConfirmationDialog({
            title: "Restore items",
            message: `You are about to restore ${entriesLabel}. Are you sure you want to continue?`,
            loadingLabel: `Processing ${entriesLabel}`,
            execute: async () => {
                if (worker.isSelectedAll) {
                    await worker.processInBulk(params => actions.bulkRestore(params));
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
                        await actions.restoreItem(item.id);

                        report.success({
                            title: `${item.title}`,
                            message: (
                                <RestoreItemsReportMessage
                                    onLocationClick={() => onLocationClick(item)}
                                />
                            )
                        });
                    } catch (e: any) {
                        report.error({
                            title: `${item.title}`,
                            message: e.message || "Unknown error while restoring the item."
                        });
                    }
                });

                worker.resetItems();
                await actions.refresh();

                showResultsDialog({
                    results: worker.results,
                    title: "Restore items",
                    message: "Finished restoring items! See full report below:"
                });
            }
        });

    return (
        <Tooltip
            side={"bottom"}
            content={`Restore ${entriesLabel}`}
            trigger={
                <ButtonDefault
                    icon={<RestoreIcon />}
                    onAction={openRestoreEntriesDialog}
                    size={"sm"}
                >
                    {"Restore"}
                </ButtonDefault>
            }
        />
    );
});

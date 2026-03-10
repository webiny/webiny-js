import React, { useCallback } from "react";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { useWbScheduler } from "./useWbScheduler.js";
import type { WbSchedulerEntry } from "~/types.js";

interface UseCancelWbSchedulerItemParams {
    item: Pick<WbSchedulerEntry, "id" | "title" | "type">;
}

export const useCancelWbSchedulerItem = ({ item }: UseCancelWbSchedulerItemParams) => {
    const { cancelItem } = useWbScheduler();
    const { showSnackbar } = useSnackbar();

    const { showConfirmation } = useConfirmationDialog({
        title: "Cancel scheduled action?",
        message: (
            <p>
                You are about to cancel scheduled action for this item!
                <br />
                Are you sure you want to cancel scheduled <strong>{item.type}</strong> for{" "}
                <strong>{item.title}</strong>?
            </p>
        )
    });

    const openDialogCancelWbSchedulerItem = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await cancelItem(item.id);
                    showSnackbar(`Action on item "${item.title}" was canceled successfully!`);
                } catch (ex) {
                    showSnackbar(ex.message || `Error while canceling action for "${item.title}".`);
                }
            }),
        [item]
    );

    return { openDialogCancelWbSchedulerItem };
};

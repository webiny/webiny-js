import React, { useCallback } from "react";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { useScheduler } from "./useScheduler";
import { SchedulerEntry } from "~/types";

interface UseCancelScheduleItemParams {
    item: Pick<SchedulerEntry, "id" | "title" | "type">;
}

export const useCancelSchedulerItem = ({ item }: UseCancelScheduleItemParams) => {
    const { cancelItem } = useScheduler();
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

    const openDialogCancelSchedulerItem = useCallback(
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

    return { openDialogCancelSchedulerItem };
};

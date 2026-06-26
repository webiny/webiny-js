import React, { useCallback } from "react";
import { useConfirmationDialog } from "@webiny/app-admin";
import type { SchedulerEntry } from "~/types.js";
import { useSchedulerListPresenter } from "~/presentation/schedulerList/useSchedulerListPresenter.js";
import { useToast } from "@webiny/admin-ui";

interface UseCancelScheduleItemParams {
    item: Pick<SchedulerEntry, "id" | "title" | "actionType">;
}

export const useCancelSchedulerItem = ({ item }: UseCancelScheduleItemParams) => {
    const presenter = useSchedulerListPresenter();
    const toast = useToast();

    const { showConfirmation } = useConfirmationDialog({
        title: "Cancel scheduled action?",
        message: (
            <p>
                You are about to cancel scheduled action for this item!
                <br />
                Are you sure you want to cancel scheduled <strong>{item.actionType}</strong> for{" "}
                <strong>{item.title}</strong>?
            </p>
        )
    });

    const openDialogCancelSchedulerItem = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await presenter.cancelItem(item.id);
                    toast.showSuccessToast({
                        title: `Action on item "${item.title}" was canceled successfully!`
                    });
                } catch (ex) {
                    toast.showWarningToast({
                        title: ex.message || `Error while canceling action for "${item.title}".`
                    });
                }
            }),
        [item]
    );

    return { openDialogCancelSchedulerItem };
};

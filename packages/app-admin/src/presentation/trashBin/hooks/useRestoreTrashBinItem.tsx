import React, { useCallback } from "react";
import { useConfirmationDialog, useSnackbar } from "~/index.js";
import type { TrashBinItem } from "../abstractions.js";
import { useTrashBinPresenter } from "./useTrashBinPresenter.js";

interface UseRestoreItemParams {
    item: TrashBinItem;
}

export const useRestoreTrashBinItem = ({ item }: UseRestoreItemParams) => {
    const { actions, onItemAfterRestore } = useTrashBinPresenter();
    const { showSnackbar } = useSnackbar();

    const { showConfirmation } = useConfirmationDialog({
        title: "Restore item",
        message: (
            <p>
                You are about to restore <strong>{item.title}</strong>.
                <br />
                Are you sure you want to continue?
            </p>
        )
    });

    const openDialogRestoreItem = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await actions.restoreItem(item.id);
                    await actions.refresh();
                    showSnackbar(`${item.title} was restored successfully!`);

                    if (onItemAfterRestore) {
                        await onItemAfterRestore(item);
                    }
                } catch (ex: any) {
                    showSnackbar(ex.message || `Error while restoring ${item.title}`);
                }
            }),
        [item, actions, onItemAfterRestore, showConfirmation, showSnackbar]
    );

    return { openDialogRestoreItem };
};

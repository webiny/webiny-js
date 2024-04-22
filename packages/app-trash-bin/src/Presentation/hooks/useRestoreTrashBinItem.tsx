import React, { useCallback } from "react";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { useTrashBin } from "./useTrashBin";
import { SnackbarAction } from "@webiny/ui/Snackbar";
import { TrashBinItemDTO } from "~/Domain";

interface UseRestoreItemParams {
    item: TrashBinItemDTO;
}

export const useRestoreTrashBinItem = ({ item }: UseRestoreItemParams) => {
    const { restoreItem, onNavigateAfterRestoreItem, getRestoredItemById } = useTrashBin();
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
                    await restoreItem(item.id);
                    const restoredItem = await getRestoredItemById(item.id);

                    showSnackbar(`${item.title} was restored successfully!`, {
                        action: restoredItem && (
                            <SnackbarAction
                                label="Show location"
                                onClick={() => onNavigateAfterRestoreItem(restoredItem)}
                            />
                        )
                    });
                } catch (ex) {
                    showSnackbar(ex.message || `Error while restoring ${item.title}`);
                }
            }),
        [item]
    );

    return { openDialogRestoreItem };
};

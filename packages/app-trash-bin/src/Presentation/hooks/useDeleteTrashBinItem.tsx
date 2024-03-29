import React, { useCallback } from "react";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { TrashBinItemDTO } from "@webiny/app-trash-bin-common";
import { useTrashBin } from "./useTrashBin";

interface UseDeleteItemParams {
    item: TrashBinItemDTO;
}

export const useDeleteTrashBinItem = ({ item }: UseDeleteItemParams) => {
    const { deleteItem } = useTrashBin();
    const { showSnackbar } = useSnackbar();

    const { showConfirmation } = useConfirmationDialog({
        title: "Delete item",
        message: (
            <p>
                You are about to delete this item and all of its revisions!
                <br />
                Are you sure you want to permanently delete <strong>{item.title}</strong>?
            </p>
        )
    });

    const openDialogDeleteItem = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await deleteItem(item.id);
                    showSnackbar(`${item.title} was deleted successfully!`);
                } catch (ex) {
                    showSnackbar(ex.message || `Error while deleting ${item.title}`);
                }
            }),
        [item]
    );

    return { openDialogDeleteItem };
};

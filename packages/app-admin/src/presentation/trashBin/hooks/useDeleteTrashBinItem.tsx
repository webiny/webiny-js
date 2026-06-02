import React, { useCallback } from "react";
import { useConfirmationDialog, useSnackbar } from "~/index.js";
import type { TrashBinItem } from "../abstractions.js";
import { useTrashBinPresenter } from "./useTrashBinPresenter.js";

interface UseDeleteItemParams {
    item: TrashBinItem;
}

export const useDeleteTrashBinItem = ({ item }: UseDeleteItemParams) => {
    const { actions } = useTrashBinPresenter();
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
                    await actions.deleteItem(item.id);
                    showSnackbar(`${item.title} was deleted successfully!`);
                } catch (ex: any) {
                    showSnackbar(ex.message || `Error while deleting ${item.title}`);
                }
            }),
        [item, actions, showConfirmation, showSnackbar]
    );

    return { openDialogDeleteItem };
};

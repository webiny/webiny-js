import React, { useCallback } from "react";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { TrashBinItemDTO } from "@webiny/app-trash-bin-common";
import { useTrashBin } from "./useTrashBin";

interface UseDeleteItemParams {
    item: TrashBinItemDTO;
    onAccept?: () => void;
    onCancel?: () => void;
}

export const useDeleteTrashBinItem = ({ item, onAccept, onCancel }: UseDeleteItemParams) => {
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
                await deleteItem(item.id);

                showSnackbar(`${item.title} was deleted successfully!`);

                if (typeof onAccept === "function") {
                    await onAccept();
                }
            }, onCancel),
        [item]
    );

    return { openDialogDeleteItem };
};

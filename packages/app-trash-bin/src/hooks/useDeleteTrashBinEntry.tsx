import React, { useCallback } from "react";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { TrashBinEntryDTO } from "@webiny/app-trash-bin-common";
import { useTrashBin } from "~/hooks/useTrashBin";

interface UseDeleteEntryParams {
    entry: TrashBinEntryDTO;
    onAccept?: () => void;
    onCancel?: () => void;
}

export const useDeleteTrashBinEntry = ({ entry, onAccept, onCancel }: UseDeleteEntryParams) => {
    const { controller } = useTrashBin();
    const { showSnackbar } = useSnackbar();

    const { showConfirmation } = useConfirmationDialog({
        title: "Delete item",
        message: (
            <p>
                You are about to delete this item and all of its revisions!
                <br />
                Are you sure you want to permanently delete <strong>{entry.title}</strong>?
            </p>
        )
    });

    const openDialogDeleteEntry = useCallback(
        () =>
            showConfirmation(async () => {
                await controller.deleteEntry(entry.id);

                showSnackbar(`${entry.title} was deleted successfully!`);

                if (typeof onAccept === "function") {
                    await onAccept();
                }
            }, onCancel),
        [entry]
    );

    return { openDialogDeleteEntry };
};

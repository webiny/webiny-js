import React, { useCallback } from "react";
import get from "lodash/get";
import { useConfirmationDialog, useDialog, useSnackbar } from "@webiny/app-admin";
import { parseIdentifier } from "@webiny/utils";
import { useCms, useContentEntry } from "~/admin/hooks";

interface ShowConfirmationDialogParams {
    onAccept?: () => void;
    onCancel?: () => void;
}

interface UseDeleteEntryDialogResponse {
    showConfirmationDialog: (params: ShowConfirmationDialogParams) => void;
}

export const useDeleteEntry = (): UseDeleteEntryDialogResponse => {
    const { deleteEntry } = useCms();
    const { contentModel, entry, setLoading, listQueryVariables } = useContentEntry();
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useDialog();

    const title = get(entry, "meta.title");
    const { showConfirmation } = useConfirmationDialog({
        title: "Delete content entry",
        message: (
            <p>
                You are about to delete this content entry and all of its revisions!
                <br />
                Are you sure you want to permanently delete <strong>{title}</strong>?
            </p>
        ),
        dataTestId: "cms.content-form.header.delete-dialog"
    });

    const showConfirmationDialog = useCallback(
        ({ onAccept, onCancel }) =>
            showConfirmation(async () => {
                setLoading(true);

                const { id: entryId } = parseIdentifier(entry.id);
                const { error } = await deleteEntry({
                    model: contentModel,
                    entry,
                    id: entryId,
                    listQueryVariables
                });

                setLoading(false);

                if (error) {
                    showDialog(error.message, { title: "Could not delete content!" });
                    return;
                }

                showSnackbar(
                    <span>
                        <strong>{title}</strong> was deleted successfully!
                    </span>
                );

                if (typeof onAccept === "function") {
                    await onAccept();
                }
            }, onCancel),
        [entry]
    );

    return { showConfirmationDialog };
};

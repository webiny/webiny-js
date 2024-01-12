import React, { useCallback } from "react";
import get from "lodash/get";
import { useConfirmationDialog, useDialog, useSnackbar } from "@webiny/app-admin";
import { parseIdentifier } from "@webiny/utils";
import { useCms, useContentEntry } from "~/admin/hooks";
import { useNavigateFolder, useRecords } from "@webiny/app-aco";

interface ShowConfirmationDialogParams {
    onAccept?: () => void;
    onCancel?: () => void;
}

interface UseDeleteEntryDialogResponse {
    showConfirmationDialog: (params: ShowConfirmationDialogParams) => void;
}

export const useDeleteEntry = (): UseDeleteEntryDialogResponse => {
    const { deleteEntry } = useCms();
    const { contentModel, entry } = useContentEntry();
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useDialog();
    const { navigateToLatestFolder } = useNavigateFolder();
    const { removeRecordFromCache } = useRecords();

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
        ({ onAccept, onCancel }: ShowConfirmationDialogParams) =>
            showConfirmation(async () => {
                const { id: entryId } = parseIdentifier(entry.id);
                const { error } = await deleteEntry({
                    model: contentModel,
                    entry,
                    id: entryId
                });

                if (error) {
                    showDialog(error.message, { title: "Could not delete content!" });
                    return;
                }

                showSnackbar(`${title} was deleted successfully!`);
                removeRecordFromCache(entry.id);
                navigateToLatestFolder();

                if (typeof onAccept === "function") {
                    await onAccept();
                }
            }, onCancel),
        [entry]
    );

    return { showConfirmationDialog };
};

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
        title: "Trash entry",
        message: (
            <p>
                Are you sure you want to trash <strong>{title}</strong>?
                <br />
                This action will include all of its revisions?
            </p>
        ),
        dataTestId: "cms.content-form.header.delete-dialog"
    });

    const showConfirmationDialog = useCallback(
        ({ onAccept, onCancel }) =>
            showConfirmation(async () => {
                const { id: entryId } = parseIdentifier(entry.id);
                const { error } = await deleteEntry({
                    model: contentModel,
                    entry,
                    id: entryId
                });

                if (error) {
                    showDialog(error.message, { title: `Could not trash ${title}!` });
                    return;
                }

                showSnackbar(`${title} has been trashed successfully!`);
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

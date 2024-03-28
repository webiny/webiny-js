import React, { useCallback } from "react";
import get from "lodash/get";
import { useConfirmationDialog, useDialog, useSnackbar } from "@webiny/app-admin";
import { parseIdentifier } from "@webiny/utils";
import { useCms, useModel } from "~/admin/hooks";
import { useNavigateFolder, useRecords } from "@webiny/app-aco";
import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";

interface UseDeleteEntryParams {
    entry: CmsContentEntry;
    onAccept?: () => void;
    onCancel?: () => void;
}

export const useDeleteEntry = ({ entry, onAccept, onCancel }: UseDeleteEntryParams) => {
    const { deleteEntry } = useCms();
    const { model } = useModel();
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

    const openDialogDeleteEntry = useCallback(
        () =>
            showConfirmation(async () => {
                const { id: entryId } = parseIdentifier(entry.id);
                const { error } = await deleteEntry({
                    model,
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

    return { openDialogDeleteEntry };
};

import React, { useCallback } from "react";
import { useDeletePage } from "~/features/pages/index.js";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import type { DocumentDto } from "~/modules/pages/PagesList/presenters/index.js";

interface UseDeletePageConfirmationDialogProps {
    page: DocumentDto;
}

export const useDeletePageConfirmationDialog = ({ page }: UseDeletePageConfirmationDialogProps) => {
    const { deletePage } = useDeletePage();
    const { showSnackbar } = useSnackbar();

    const { showConfirmation } = useConfirmationDialog({
        title: "Delete page",
        message: (
            <p>
                You are about to permanently delete <strong>{page.title}</strong> and all of its
                revisions. Are you sure you want to continue?
            </p>
        )
    });

    const openUnpublishPageConfirmationDialog = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await deletePage({ id: page.id });
                    showSnackbar(`${page.title} was deleted successfully!`);
                } catch (ex) {
                    showSnackbar(ex.message || `Error while deleting ${page.title}`);
                }
            }),
        [page]
    );

    return { openUnpublishPageConfirmationDialog };
};

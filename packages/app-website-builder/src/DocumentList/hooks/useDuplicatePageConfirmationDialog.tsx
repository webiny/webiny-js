import React, { useCallback } from "react";
import { useDuplicatePage } from "~/features/pages/index.js";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import type { DocumentDto } from "~/DocumentList/presenters/index.js";

interface UseDuplicatePageConfirmationDialogProps {
    page: DocumentDto;
}

export const useDuplicatePageConfirmationDialog = ({
    page
}: UseDuplicatePageConfirmationDialogProps) => {
    const { duplicatePage } = useDuplicatePage();
    const { showSnackbar } = useSnackbar();

    const { showConfirmation } = useConfirmationDialog({
        title: "Duplicate page",
        message: (
            <p>
                You are about to duplicate <strong>{page.title}</strong>. Are you sure you want to
                continue?
            </p>
        )
    });

    const openDuplicatePageConfirmationDialog = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await duplicatePage({ id: page.id });
                    showSnackbar(`${page.title} was duplicated successfully!`);
                } catch (ex) {
                    showSnackbar(ex.message || `Error while duplicating ${page.title}`);
                }
            }),
        [page]
    );

    return { openDuplicatePageConfirmationDialog };
};

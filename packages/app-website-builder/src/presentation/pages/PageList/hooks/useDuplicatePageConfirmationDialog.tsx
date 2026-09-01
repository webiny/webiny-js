import React, { useCallback } from "react";
import { useDuplicatePage } from "~/features/pages/index.js";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import type { PageDto } from "~/domain/Page/index.js";

interface UseDuplicatePageConfirmationDialogProps {
    page: PageDto;
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
                You are about to duplicate <strong>{page.properties.title}</strong>. Are you sure
                you want to continue?
            </p>
        )
    });

    const openDuplicatePageConfirmationDialog = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await duplicatePage({ id: page.id });
                    showSnackbar(`${page.properties.title} was duplicated successfully!`);
                } catch (ex) {
                    showSnackbar(ex.message || `Error while duplicating ${page.properties.title}`);
                }
            }),
        [page]
    );

    return { openDuplicatePageConfirmationDialog };
};

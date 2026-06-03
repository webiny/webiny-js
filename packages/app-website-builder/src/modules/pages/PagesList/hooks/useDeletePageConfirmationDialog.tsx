import React, { useCallback } from "react";
import { useDeletePage } from "~/features/pages/index.js";
import { useNamedConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import type { PageDto } from "~/domain/Page/index.js";

interface UseDeletePageConfirmationDialogProps {
    page: PageDto;
}

export const useDeletePageConfirmationDialog = ({ page }: UseDeletePageConfirmationDialogProps) => {
    const { deletePage } = useDeletePage();
    const { showSnackbar } = useSnackbar();

    const { showConfirmation } = useNamedConfirmationDialog({
        title: "Delete page",
        message: (
            <p>
                You are about to move <strong>{page.properties.title}</strong> to trash. Are you
                sure you want to continue?
            </p>
        )
    });

    const openDeletePageConfirmationDialog = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await deletePage({
                        id: page.id,
                        permanently: false
                    });
                    showSnackbar(`${page.properties.title} was moved to trash!`);
                } catch (ex) {
                    showSnackbar(ex.message || `Error while deleting ${page.properties.title}`);
                }
            }),
        [page]
    );

    return { openDeletePageConfirmationDialog };
};

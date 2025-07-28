import React, { useCallback } from "react";
import { usePublishPage } from "~/features/pages/index.js";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import type { DocumentDto } from "~/modules/pages/PagesList/presenters/index.js";

interface UsePublishPageConfirmationDialogProps {
    page: DocumentDto;
}

export const usePublishPageConfirmationDialog = ({
    page
}: UsePublishPageConfirmationDialogProps) => {
    const { publishPage } = usePublishPage();
    const { showSnackbar } = useSnackbar();

    const { showConfirmation } = useConfirmationDialog({
        title: "Publish page",
        message: (
            <p>
                You are about to publish <strong>{page.title}</strong>. Are you sure you want to
                continue?
            </p>
        )
    });

    const openPublishPageConfirmationDialog = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await publishPage({ id: page.id });
                    showSnackbar(`${page.title} was published successfully!`);
                } catch (ex) {
                    showSnackbar(ex.message || `Error while publishing ${page.title}`);
                }
            }),
        [page]
    );

    return { openPublishPageConfirmationDialog };
};

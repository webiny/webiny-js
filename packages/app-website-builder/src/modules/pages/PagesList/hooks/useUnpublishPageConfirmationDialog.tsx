import React, { useCallback } from "react";
import { useUnpublishPage } from "~/features/pages/index.js";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import type { DocumentDto } from "~/modules/pages/PagesList/presenters/index.js";

interface UseUnpublishPageConfirmationDialogProps {
    page: DocumentDto;
}

export const useUnpublishPageConfirmationDialog = ({
    page
}: UseUnpublishPageConfirmationDialogProps) => {
    const { unpublishPage } = useUnpublishPage();
    const { showSnackbar } = useSnackbar();

    const { showConfirmation } = useConfirmationDialog({
        title: "Unpublish page",
        message: (
            <p>
                You are about to unpublish <strong>{page.title}</strong>. Are you sure you want to
                continue?
            </p>
        )
    });

    const openUnpublishPageConfirmationDialog = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await unpublishPage({ id: page.id });
                    showSnackbar(`${page.title} was unpublished successfully!`);
                } catch (ex) {
                    showSnackbar(ex.message || `Error while unpublishing ${page.title}`);
                }
            }),
        [page]
    );

    return { openUnpublishPageConfirmationDialog };
};

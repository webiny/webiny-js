import React, { useCallback } from "react";
import { useUnpublishPage } from "~/features/pages/index.js";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import type { PageDto } from "~/domain/Page/index.js";

interface UseUnpublishPageConfirmationDialogProps {
    page: PageDto;
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
                You are about to unpublish <strong>{page.properties.title}</strong>. Are you sure
                you want to continue?
            </p>
        )
    });

    const openUnpublishPageConfirmationDialog = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await unpublishPage({ id: page.id });
                    showSnackbar(`${page.properties.title} was unpublished successfully!`);
                } catch (ex) {
                    showSnackbar(ex.message || `Error while unpublishing ${page.properties.title}`);
                }
            }),
        [page]
    );

    return { openUnpublishPageConfirmationDialog };
};

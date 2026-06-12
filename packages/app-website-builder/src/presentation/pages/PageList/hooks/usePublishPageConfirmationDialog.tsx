import React, { useCallback } from "react";
import { usePublishPage } from "~/features/pages/index.js";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import type { PageDto } from "~/domain/Page/index.js";

interface UsePublishPageConfirmationDialogProps {
    page: PageDto;
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
                You are about to publish <strong>{page.properties.title}</strong>. Are you sure you
                want to continue?
            </p>
        )
    });

    const openPublishPageConfirmationDialog = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await publishPage({ id: page.id });
                    showSnackbar(`${page.properties.title} was published successfully!`);
                } catch (ex) {
                    showSnackbar(ex.message || `Error while publishing ${page.properties.title}`);
                }
            }),
        [page]
    );

    return { openPublishPageConfirmationDialog };
};

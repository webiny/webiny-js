import { useCallback } from "react";
import { useSnackbar } from "@webiny/app-admin";
import { useMoveToFolderDialog } from "@webiny/app-aco";
import type { DocumentDto } from "~/DocumentList/presenters/index.js";
import { useMovePage } from "~/features/pages/index.js";

interface UseMovePageToFolderDialog {
    page: DocumentDto;
}

export function useMovePageToFolderDialog({ page }: UseMovePageToFolderDialog) {
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useMoveToFolderDialog();
    const { movePage } = useMovePage();

    const openMovePageToFolderDialog = useCallback(() => {
        showDialog({
            title: "Move page to a new location",
            message: "Select a new location for this page:",
            loadingLabel: "Moving page...",
            acceptLabel: "Move page",
            focusedFolderId: page.data.location.folderId,
            async onAccept({ folder }) {
                await movePage({
                    id: page.id,
                    folderId: folder.id
                });
                showSnackbar(
                    `Page "${page.title}" was successfully moved to folder "${folder.title}"!`
                );
            }
        });
    }, [page.id]);

    return {
        openMovePageToFolderDialog
    };
}

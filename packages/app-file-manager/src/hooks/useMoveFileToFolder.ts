import { useCallback } from "react";
import { useSnackbar } from "@webiny/app-admin";
import { useMoveToFolderDialog } from "@webiny/app-aco";
import { FileItem } from "@webiny/app-admin/types";
import { useFileManagerView } from "~/index";

export function useMoveFileToFolder(file: FileItem) {
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useMoveToFolderDialog();
    const { moveFileToFolder } = useFileManagerView();

    return useCallback(() => {
        showDialog({
            title: "Move file to a new location",
            message: "Select a new location for this file:",
            loadingLabel: "Moving file...",
            acceptLabel: "Move file",
            focusedFolderId: file.location.folderId,
            async onAccept({ folder }) {
                await moveFileToFolder(file.id, folder.id);
                showSnackbar(
                    `File "${file.name}" was successfully moved to folder "${folder.title}"!`
                );
            }
        });
    }, [file.id]);
}

import { useCallback } from "react";
import { useSnackbar } from "@webiny/app-admin";
import { useMoveToFolderDialog } from "@webiny/app-aco";
import { useContainer } from "@webiny/app";
import { UpdateFileUseCase } from "~/features/updateFile/abstractions.js";
import type { FileItem } from "~/types.js";

export function useMoveFileToFolder(file: FileItem) {
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useMoveToFolderDialog();
    const container = useContainer();
    const updateFileUseCase = container.resolve(UpdateFileUseCase);

    return useCallback(() => {
        showDialog({
            title: "Move file to a new location",
            message: "Select a new location for this file:",
            loadingLabel: "Moving file...",
            acceptLabel: "Move file",
            focusedFolderId: file.location.folderId,
            async onAccept({ folder }) {
                await updateFileUseCase.execute({
                    id: file.id,
                    data: { location: { folderId: folder.id } }
                });
                showSnackbar(
                    `File "${file.name}" was successfully moved to folder "${folder.label}"!`
                );
            }
        });
    }, [file.id]);
}

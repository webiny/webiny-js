import { useSnackbar } from "@webiny/app-admin";
import { useDialogs } from "@webiny/app-admin";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { useDeleteFolder } from "~/features/folders/deleteFolder/index.js";
import { useCallback } from "react";

interface ShowDialogParams {
    folder: FolderDto;
}

interface UseDeleteDialogResponse {
    showDialog: (params: ShowDialogParams) => void;
}

export const useDeleteDialog = (): UseDeleteDialogResponse => {
    const dialogs = useDialogs();
    const { deleteFolder } = useDeleteFolder();
    const { showSnackbar } = useSnackbar();

    const onAccept = useCallback(async (folder: FolderDto) => {
        try {
            await deleteFolder(folder.id);
            showSnackbar(`The folder "${folder.title}" was deleted successfully.`);
        } catch (error) {
            showSnackbar(error.message);
        }
    }, []);

    const showDialog = ({ folder }: ShowDialogParams) => {
        dialogs.showDialog({
            title: "Delete folder",
            content: `You are about to delete the folder "${folder.title}"! Are you sure you want to continue?`,
            acceptLabel: "Delete folder",
            cancelLabel: "Cancel",
            loadingLabel: "Deleting folder...",
            onAccept: () => onAccept(folder)
        });
    };

    return {
        showDialog
    };
};

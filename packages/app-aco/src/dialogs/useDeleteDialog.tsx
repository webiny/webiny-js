import { useSnackbar } from "@webiny/app-admin";
import { useDialogs } from "@webiny/app-admin";
import { useDeleteFolder } from "~/features/index.js";
import type { FolderItem } from "~/types.js";
import { useCallback } from "react";

interface ShowDialogParams {
    folder: FolderItem;
}

interface UseDeleteDialogResponse {
    showDialog: (params: ShowDialogParams) => void;
}

export const useDeleteDialog = (): UseDeleteDialogResponse => {
    const dialogs = useDialogs();
    const { deleteFolder } = useDeleteFolder();
    const { showSnackbar } = useSnackbar();

    const onAccept = useCallback(async (folder: FolderItem) => {
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

import { useDialogs } from "@webiny/app-admin";
import { FolderItem } from "~/types.js";

interface ShowDialogParams {
    folder: FolderItem;
    targetFolder: FolderItem;
    onAccept: (folder: FolderItem, targetFolder: FolderItem) => Promise<void>;
}

interface UseConfirmMoveFolderDialogResponse {
    showDialog: (params: ShowDialogParams) => void;
}

export const useConfirmMoveFolderDialog = (): UseConfirmMoveFolderDialogResponse => {
    const dialogs = useDialogs();

    const showDialog = ({ folder, targetFolder, onAccept }: ShowDialogParams) => {
        dialogs.showDialog({
            title: "Move folder",
            content: `You are about to move the folder "${folder.title}" into "${targetFolder.title}"! Are you sure you want to continue?`,
            acceptLabel: "Move folder",
            cancelLabel: "Cancel",
            loadingLabel: "Moving folder...",
            onAccept: () => onAccept(folder, targetFolder)
        });
    };

    return {
        showDialog
    };
};

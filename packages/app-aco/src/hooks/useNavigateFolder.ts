import { useContext, useMemo } from "react";
import { NavigateFolderContext } from "~/contexts/navigateFolder";

export const useNavigateFolder = () => {
    const context = useContext(NavigateFolderContext);
    if (!context) {
        throw new Error("useFolders must be used within a FoldersProvider");
    }

    return useMemo(() => {
        return {
            currentFolderId: context.currentFolderId,
            setFolderToStorage: context.setFolderToStorage,
            navigateToListHome: context.navigateToListHome,
            navigateToFolder: context.navigateToFolder,
            navigateToLatestFolder: context.navigateToLatestFolder
        };
    }, [context.navigateToLatestFolder, context.currentFolderId]);
};

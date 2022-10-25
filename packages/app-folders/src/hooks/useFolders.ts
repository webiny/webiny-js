import { useContext, useEffect } from "react";
import { FoldersContext } from "~/contexts/folders";
import { FolderItem } from "~/types";

export const useFolders = (type: string) => {
    const context = useContext(FoldersContext);
    if (!context) {
        throw new Error("useFolders must be used within a FoldersProvider");
    }

    useEffect(() => {
        /**
         * On first mount, call `listFolders`, which will either issue a network request, or load folders from cache.
         * We don't need to store the result of it to any local state; that is managed by the context provider.
         */
        context.listFolders(type);
    }, []);

    return {
        /**
         * NOTE: do NOT expose listFolders from this hook, because you already have folders in the `folders` property.
         * You'll never need to call `listFolders` from any component. As soon as you call `useFolders()`, you'll initiate
         * fetching of `folders`, which is managed by the FoldersContext.
         */
        loading: context.loading,
        folders: context.folders[type],
        getFolder(id: string) {
            return context.getFolder(id);
        },
        createFolder(folder: Omit<FolderItem, "id">) {
            return context.createFolder(folder);
        },
        updateFolder(folder: FolderItem) {
            return context.updateFolder(folder);
        },
        deleteFolder(folder: FolderItem) {
            return context.deleteFolder(folder);
        }
    };
};

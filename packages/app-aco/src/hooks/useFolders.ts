import { useContext, useEffect, useMemo } from "react";
import { FoldersContext } from "~/contexts/folders";

export const useFolders = () => {
    const context = useContext(FoldersContext);
    if (!context) {
        throw new Error("useFolders must be used within a FoldersProvider");
    }

    const { folders, loading, listFolders, ...other } = context;

    useEffect(() => {
        /**
         * On first mount, call `listFolders`, which will either issue a network request, or load folders from cache.
         * We don't need to store the result of it to any local state; that is managed by the context provider.
         *
         * IMPORTANT: we check if the folders array exists: the hook can be used from multiple components and
         * fetch the outdated list from Apollo Cache. Since the state is managed locally, we fetch the folders only
         * at the first mount.
         */
        if (folders) {
            return;
        }
        listFolders();
    }, []);

    return useMemo(
        () => ({
            /**
             * NOTE: do NOT expose listFolders from this hook, because you already have folders in the `folders` property.
             * You'll never need to call `listFolders` from any component. As soon as you call `useFolders()`, you'll initiate
             * fetching of `folders`, which is managed by the FoldersContext.
             */
            loading,
            folders,
            ...other
        }),
        [folders, loading]
    );
};

import { useContext, useMemo } from "react";
import { loadingRepositoryFactory } from "@webiny/app-utils";
import { FoldersContext } from "~/contexts/folders";
import {
    folderCacheFactory,
    useCreateFolder,
    useDeleteFolder,
    useGetCanManageContent,
    useGetCanManagePermissions,
    useGetCanManageStructure,
    useGetDescendantFolders,
    useGetFolder,
    useListFolders,
    useUpdateFolder
} from "~/features/folder";

export const useFolders = () => {
    const foldersContext = useContext(FoldersContext);

    if (!foldersContext) {
        throw new Error("useFolders must be used within a FoldersProvider");
    }

    const { type } = foldersContext;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    // Folders cache
    const foldersCache = useMemo(() => {
        return folderCacheFactory.getCache(type);
    }, [type]);

    // Loading repository
    const loadingRepository = useMemo(() => {
        return loadingRepositoryFactory.getRepository();
    }, [type]);

    const { createFolder } = useCreateFolder(foldersCache, loadingRepository, type);
    const { deleteFolder } = useDeleteFolder(foldersCache, loadingRepository);
    const { listFolders, folders, loading } = useListFolders(foldersCache, loadingRepository, type);
    const { updateFolder } = useUpdateFolder(foldersCache, loadingRepository);
    const { getDescendantFolders } = useGetDescendantFolders(foldersCache);
    const { getFolder } = useGetFolder(foldersCache, loadingRepository);
    const { canManageStructure } = useGetCanManageStructure(foldersCache);
    const { canManagePermissions } = useGetCanManagePermissions(foldersCache);
    const { canManageContent } = useGetCanManageContent(foldersCache);

    return {
        folders,
        loading,
        listFolders,
        getFolder,
        getDescendantFolders,
        createFolder,
        updateFolder,
        deleteFolder,
        folderLevelPermissions: {
            canManageStructure,
            canManagePermissions,
            canManageContent
        }
    };
};

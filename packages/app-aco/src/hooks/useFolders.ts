import { useContext, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { loadingRepositoryFactory } from "@webiny/app-utils";
import { FoldersContext } from "~/contexts/folders";
import {
    folderCacheFactory,
    FolderDtoMapper,
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
import { FolderItem } from "~/types";

export const useFolders = () => {
    const [vm, setVm] = useState<{
        folders: FolderItem[];
        loading: Record<string, boolean>;
    }>({
        folders: [],
        loading: {
            INIT: true
        }
    });

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
    const { listFolders } = useListFolders(foldersCache, loadingRepository, type);
    const { updateFolder } = useUpdateFolder(foldersCache, loadingRepository);
    const { getDescendantFolders } = useGetDescendantFolders(foldersCache);
    const { getFolder } = useGetFolder(foldersCache, loadingRepository);
    const { canManageStructure } = useGetCanManageStructure(foldersCache);
    const { canManagePermissions } = useGetCanManagePermissions(foldersCache);
    const { canManageContent } = useGetCanManageContent(foldersCache);

    useEffect(() => {
        if (foldersCache.hasItems()) {
            return; // Skip if we already have folders in the cache.
        }

        listFolders();
    }, []);

    useEffect(() => {
        return autorun(() => {
            const folders = foldersCache.getItems().map(folder => FolderDtoMapper.toDTO(folder));

            setVm(vm => ({
                ...vm,
                folders
            }));
        });
    }, [foldersCache]);

    useEffect(() => {
        return autorun(() => {
            const loading = loadingRepository.get();

            setVm(vm => ({
                ...vm,
                loading
            }));
        });
    }, [loadingRepository]);

    return {
        ...vm,
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

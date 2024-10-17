import { useContext, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { loadingRepositoryFactory } from "@webiny/app-utils";
import { useWcp } from "@webiny/app-wcp";
import { FoldersContext, FoldersContextFolderLevelPermissions } from "~/contexts/folders";
import {
    folderCacheFactory,
    FolderDtoMapper,
    useCreateFolder,
    useDeleteFolder,
    useGetDescendantFolders,
    useGetFolder,
    useListFolders,
    useUpdateFolder
} from "~/features/folder";
import { FolderItem } from "~/types";
import { ROOT_FOLDER } from "~/constants";

export const useFolders = () => {
    const { canUseFolderLevelPermissions } = useWcp();

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
    const { deleteFolder } = useDeleteFolder(foldersCache, loadingRepository, type);
    const { listFolders } = useListFolders(foldersCache, loadingRepository, type);
    const { updateFolder } = useUpdateFolder(foldersCache, loadingRepository, type);
    const { getDescendantFolders } = useGetDescendantFolders(foldersCache);
    const { getFolder } = useGetFolder(foldersCache, loadingRepository);

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

    const folderLevelPermissions: FoldersContextFolderLevelPermissions = useMemo(() => {
        const createCanManage =
            (callback: (folder: FolderItem) => boolean) => (folderId: string) => {
                if (!canUseFolderLevelPermissions() || folderId === ROOT_FOLDER) {
                    return true;
                }

                const folder = vm.folders?.find(folder => folder.id === folderId);
                if (!folder) {
                    return false;
                }

                return callback(folder);
            };

        return {
            canManageStructure: createCanManage(folder => folder.canManageStructure),
            canManagePermissions: createCanManage(folder => folder.canManagePermissions),
            canManageContent: createCanManage(folder => folder.canManageContent)
        };
    }, [vm.folders]);

    return {
        ...vm,
        listFolders,
        getFolder,
        getDescendantFolders,
        createFolder,
        updateFolder,
        deleteFolder,

        // OLD
        folderLevelPermissions
    };
};

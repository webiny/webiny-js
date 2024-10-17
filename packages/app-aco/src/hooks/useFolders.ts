import { useContext, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { loadingRepositoryFactory } from "@webiny/app-utils";
import { FoldersContext } from "~/contexts/folders";
import { AcoAppContext } from "~/contexts/app";
import { folderCacheFactory } from "~/features/folder/cache";
import { useCreateFolder } from "~/features/folder/createFolder/useCreateFolder";
import { useDeleteFolder } from "~/features/folder/deleteFolder/useDeleteFolder";
import { useGetDescendantFolders } from "~/features/folder/getDescendantFolders/useGetDescendantFolders";
import { useGetFolder } from "~/features/folder/getFolder/useGetFolder";
import { useListFolders } from "~/features/folder/listFolders/useListFolders";
import { useUpdateFolder } from "~/features/folder/updateFolder/useUpdateFolder";
import { FolderItem } from "~/types";
import { FolderDtoMapper } from "~/features/folder/listFolders/FolderDto";

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
    const appContext = useContext(AcoAppContext);

    if (!foldersContext) {
        throw new Error("useFolders must be used within a FoldersProvider");
    }

    const app = appContext ? appContext.app : undefined;

    const type = foldersContext.type ?? app?.id;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    const { folderLevelPermissions } = foldersContext;

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

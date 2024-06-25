import { useContext, useCallback, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { useApolloClient } from "@apollo/react-hooks";

import { FoldersContext } from "~/contexts/folders";
import { AcoAppContext } from "~/contexts/app";
import { FolderItem } from "~/types";
import { folderCacheFactory } from "~/Domain/Caches";
import { loadingRepositoryFactory } from "@webiny/app-utils";
import {
    CreateFolderGraphQLGateway,
    DeleteFolderGraphQLGateway,
    GetFolderGraphQLGateway,
    ListFoldersGraphQLGateway,
    UpdateFolderGraphQLGateway
} from "~/Gateways";
import {
    CreateFolderRepository,
    CreateFolderRepositoryWithLoading,
    DeleteFolderRepository,
    DeleteFolderRepositoryWithLoading,
    GetDescendantFoldersRepository,
    GetFolderRepository,
    GetFolderRepositoryWithLoading,
    ListFoldersRepository,
    ListFoldersRepositoryWithLoading,
    UpdateFolderRepository,
    UpdateFolderRepositoryWithLoading
} from "~/Domain/Repositories";
import { FolderMapper } from "~/Domain/Models";

export const useFolders = () => {
    const client = useApolloClient();
    const foldersContext = useContext(FoldersContext);
    const appContext = useContext(AcoAppContext);

    const [vm, setVm] = useState<{
        folders: FolderItem[] | null;
        loading: Record<string, boolean>;
    }>({
        folders: null,
        loading: {}
    });

    if (!foldersContext) {
        throw new Error("useFolders must be used within a FoldersProvider");
    }

    const app = appContext ? appContext.app : undefined;

    const type = foldersContext.type ?? app?.id;

    if (!type) {
        throw Error(`FoldersProvider requires a "type" prop or an AcoAppContext to be available!`);
    }

    // Folders cache
    const foldersCache = useMemo(() => {
        return folderCacheFactory.getCache(type);
    }, [type]);

    // Loading Cache
    const loadingRepository = useMemo(() => {
        return loadingRepositoryFactory.getRepository();
    }, []);

    // List
    const listFolders = useCallback(() => {
        const listFoldersGateway = new ListFoldersGraphQLGateway(client);
        const listFoldersRepository = new ListFoldersRepository(
            type,
            foldersCache,
            listFoldersGateway
        );

        const repository = new ListFoldersRepositoryWithLoading(
            loadingRepository,
            listFoldersRepository
        );
        return repository.execute();
    }, [type, client, foldersCache, loadingRepository]);

    // Get
    const getFolder = useCallback(
        (id: string) => {
            const getFolderGateway = new GetFolderGraphQLGateway(client);
            const getFolderRepository = new GetFolderRepository(foldersCache, getFolderGateway);

            const repository = new GetFolderRepositoryWithLoading(
                loadingRepository,
                getFolderRepository
            );
            return repository.execute(id);
        },
        [client, foldersCache, loadingRepository]
    );

    const getDescendantFolders = useCallback(
        (id: string) => {
            const repository = new GetDescendantFoldersRepository(foldersCache);
            return repository.execute(id);
        },
        [foldersCache]
    );

    // Create
    const createFolder = useCallback(
        (folder: FolderItem) => {
            const createFolderGateway = new CreateFolderGraphQLGateway(client);
            const createFolderRepository = new CreateFolderRepository(
                foldersCache,
                createFolderGateway
            );

            const repository = new CreateFolderRepositoryWithLoading(
                loadingRepository,
                createFolderRepository
            );
            return repository.execute(folder);
        },
        [client, foldersCache, loadingRepository]
    );

    // Update
    const updateFolder = useCallback(
        (folder: FolderItem) => {
            const updateFolderGateway = new UpdateFolderGraphQLGateway(client);
            const updateFolderRepository = new UpdateFolderRepository(
                foldersCache,
                updateFolderGateway
            );

            const repository = new UpdateFolderRepositoryWithLoading(
                loadingRepository,
                updateFolderRepository
            );
            return repository.execute(folder);
        },
        [client, foldersCache, loadingRepository]
    );

    // Delete
    const deleteFolder = useCallback(
        (folder: FolderItem) => {
            const deleteFolderGateway = new DeleteFolderGraphQLGateway(client);
            const deleteFolderRepository = new DeleteFolderRepository(
                foldersCache,
                deleteFolderGateway
            );

            const repository = new DeleteFolderRepositoryWithLoading(
                loadingRepository,
                deleteFolderRepository
            );
            return repository.execute(folder);
        },
        [client, foldersCache, loadingRepository]
    );

    const { folderLevelPermissions } = foldersContext;

    useEffect(() => {
        /**
         * On first mount, call `listFolders`, which will either issue a network request, or load folders from cache.
         * We don't need to store the result of it to any local state; that is managed by the context provider.
         *
         * IMPORTANT: we check if the folders array exists: the hook can be used from multiple components and
         * fetch the outdated list from Apollo Cache. Since the state is managed locally, we fetch the folders only
         * at the first mount.
         */
        if (vm.folders) {
            return;
        }
        listFolders();
    }, []);

    useEffect(() => {
        return autorun(() => {
            const mapper = new FolderMapper();

            setVm(vm => ({
                ...vm,
                folders: foldersCache.getItems().map(folder => mapper.toDTO(folder))
            }));
        });
    }, [foldersCache]);

    useEffect(() => {
        return autorun(() => {
            setVm(vm => ({
                ...vm,
                loading: loadingRepository.get()
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

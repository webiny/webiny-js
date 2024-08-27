import { useContext, useCallback, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { useApolloClient } from "@apollo/react-hooks";

import { FoldersContext } from "~/contexts/folders";
import { AcoAppContext } from "~/contexts/app";
import { FolderItem } from "~/types";

import { loadingRepositoryFactory } from "@webiny/app-utils";

import { FolderMapper } from "~/Domain/Models";

import { folderCacheFactory } from "~/folders/cache";
import {
    CreateFolderGraphQLGateway,
    DeleteFolderGraphQLGateway,
    GetFolderGraphQLGateway,
    ListFoldersGraphQLGateway,
    UpdateFolderGraphQLGateway
} from "~/folders/gateways";
import {
    CreateFolderUseCase,
    DeleteFolderUseCase,
    GetFolderUseCase,
    ListFoldersUseCase,
    UpdateFolderUseCase
} from "~/folders/useCases";
import {
    CreateFolderController,
    DeleteFolderController,
    GetFolderController,
    ListFoldersController,
    UpdateFolderController
} from "~/folders/controllers";
import {
    CreateFolderRepository,
    CreateFolderRepositoryWithLoading,
    DeleteFolderRepository,
    DeleteFolderRepositoryWithLoading,
    GetFolderRepository,
    GetFolderRepositoryWithLoading,
    GetDescendantFoldersRepository,
    ListFoldersRepository,
    ListFoldersRepositoryWithLoading,
    UpdateFolderRepository,
    UpdateFolderRepositoryWithLoading
} from "~/folders/repositories";

export const useFolders = () => {
    const client = useApolloClient();
    const foldersContext = useContext(FoldersContext);
    const appContext = useContext(AcoAppContext);

    const [folders, setFolders] = useState<FolderItem[] | null>(null);
    const [loading, setLoading] = useState<Record<string, boolean>>({});

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
        const listFoldersRepository = new ListFoldersRepository(foldersCache, listFoldersGateway);
        const repository = new ListFoldersRepositoryWithLoading(
            loadingRepository,
            listFoldersRepository
        );
        const listFoldersUseCase = new ListFoldersUseCase(repository);
        const listFoldersController = new ListFoldersController(listFoldersUseCase);
        return listFoldersController.execute(type);
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
            const getFolderUseCase = new GetFolderUseCase(repository);
            const getFolderController = new GetFolderController(getFolderUseCase);
            return getFolderController.execute(id);
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
            const createFolderUseCase = new CreateFolderUseCase(repository);
            const createFolderController = new CreateFolderController(createFolderUseCase);
            return createFolderController.execute(folder, type);
        },
        [client, foldersCache, loadingRepository, type]
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
            const updateFolderUseCase = new UpdateFolderUseCase(repository);
            const updateFolderController = new UpdateFolderController(updateFolderUseCase);
            return updateFolderController.execute(folder);
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
            const deleteFolderUseCase = new DeleteFolderUseCase(repository);
            const deleteFolderController = new DeleteFolderController(deleteFolderUseCase);
            return deleteFolderController.execute(folder);
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
        const cachedItems = foldersCache.getItems();

        if (cachedItems) {
            return; // Skip if we already have folders in the cache.
        }

        listFolders();
    }, [foldersCache]);

    useEffect(() => {
        const mapper = new FolderMapper();
        return autorun(() => {
            const newFolderState = foldersCache.getItems().map(folder => mapper.toDTO(folder));
            setFolders(newFolderState);
        });
    }, [foldersCache]);

    useEffect(() => {
        return autorun(() => {
            const newLoadingState = loadingRepository.get();
            setLoading(newLoadingState);
        });
    }, [loadingRepository]);

    return {
        folders,
        loading,
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

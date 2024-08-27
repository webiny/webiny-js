import { useContext, useCallback, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { useApolloClient } from "@apollo/react-hooks";
import { loadingRepositoryFactory } from "@webiny/app-utils";

import { FoldersContext } from "~/contexts/folders";
import { AcoAppContext } from "~/contexts/app";

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
    CreateFolderUseCaseWithLoading,
    DeleteFolderUseCase,
    DeleteFolderUseCaseWithLoading,
    GetFolderUseCase,
    GetFolderUseCaseWithLoading,
    ListFoldersUseCase,
    ListFoldersUseCaseWithLoading,
    UpdateFolderUseCase,
    UpdateFolderUseCaseWithLoading
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
    DeleteFolderRepository,
    GetFolderRepository,
    GetDescendantFoldersRepository,
    ListFoldersRepository,
    UpdateFolderRepository
} from "~/folders/repositories";
import { FoldersPresenter } from "~/folders/presenters";

import { FolderItem } from "~/types";

export const useFolders = () => {
    const client = useApolloClient();
    const foldersContext = useContext(FoldersContext);
    const appContext = useContext(AcoAppContext);

    const [vm, setVm] = useState({});

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

    // Presenter vm
    useEffect(() => {
        const presenter = new FoldersPresenter(foldersCache, loadingRepository);
        return autorun(() => {
            const newState = presenter.vm;
            setVm(newState);
        });
    }, [foldersCache, loadingRepository]);

    // List
    const listFolders = useCallback(() => {
        const listFoldersGateway = new ListFoldersGraphQLGateway(client);
        const listFoldersRepository = new ListFoldersRepository(foldersCache, listFoldersGateway);
        const listFoldersUseCase = new ListFoldersUseCase(listFoldersRepository);
        const listFoldersUseCaseWithLoading = new ListFoldersUseCaseWithLoading(
            loadingRepository,
            listFoldersUseCase
        );
        const listFoldersController = new ListFoldersController(listFoldersUseCaseWithLoading);
        return listFoldersController.execute(type);
    }, [type, client, foldersCache, loadingRepository]);

    // Get
    const getFolder = useCallback(
        (id: string) => {
            const getFolderGateway = new GetFolderGraphQLGateway(client);
            const getFolderRepository = new GetFolderRepository(foldersCache, getFolderGateway);
            const getFolderUseCase = new GetFolderUseCase(getFolderRepository);
            const getFolderUseCaseWithLoading = new GetFolderUseCaseWithLoading(
                loadingRepository,
                getFolderUseCase
            );
            const getFolderController = new GetFolderController(getFolderUseCaseWithLoading);
            return getFolderController.execute(id);
        },
        [client, foldersCache, loadingRepository]
    );

    // Get Descendant Folders
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
            const createFolderUseCase = new CreateFolderUseCase(createFolderRepository);
            const createFolderUseCaseWithLoading = new CreateFolderUseCaseWithLoading(
                loadingRepository,
                createFolderUseCase
            );
            const createFolderController = new CreateFolderController(
                createFolderUseCaseWithLoading
            );
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
            const updateFolderUseCase = new UpdateFolderUseCase(updateFolderRepository);
            const updateFolderUseCaseWithLoading = new UpdateFolderUseCaseWithLoading(
                loadingRepository,
                updateFolderUseCase
            );
            const updateFolderController = new UpdateFolderController(
                updateFolderUseCaseWithLoading
            );
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
            const deleteFolderUseCase = new DeleteFolderUseCase(deleteFolderRepository);
            const deleteFolderUseCaseWithLoading = new DeleteFolderUseCaseWithLoading(
                loadingRepository,
                deleteFolderUseCase
            );
            const deleteFolderController = new DeleteFolderController(
                deleteFolderUseCaseWithLoading
            );
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

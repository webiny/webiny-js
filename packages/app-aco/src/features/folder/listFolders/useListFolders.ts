import { useCallback, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { useApolloClient } from "@apollo/react-hooks";
import { LoadingRepository } from "@webiny/app-utils";
import { FoldersCache } from "../cache";
import { ListFoldersRepository } from "./ListFoldersRepository";
import { ListFoldersGqlGateway } from "./ListFoldersGqlGateway";
import { ListFoldersUseCaseWithLoading } from "./ListFoldersUseCaseWithLoading";
import { ListFoldersUseCase } from "./ListFoldersUseCase";
import { FolderDtoMapper } from "./FolderDto";
import { FolderItem } from "~/types";

export const useListFolders = (cache: FoldersCache, loading: LoadingRepository, type: string) => {
    const [vm, setVm] = useState<{
        folders: FolderItem[];
        loading: Record<string, boolean>;
    }>({
        folders: [],
        loading: {
            INIT: true
        }
    });

    const client = useApolloClient();

    const gateway = useMemo(() => {
        return new ListFoldersGqlGateway(client);
    }, [client]);

    const repository = useMemo(() => {
        return new ListFoldersRepository(cache, gateway, type);
    }, [cache, gateway, type]);

    const useCase = useMemo(() => {
        const listFolderUseCase = new ListFoldersUseCase(repository);
        return new ListFoldersUseCaseWithLoading(loading, listFolderUseCase);
    }, [repository, loading]);

    const listFolders = useCallback(() => {
        return useCase.execute();
    }, [useCase]);

    useEffect(() => {
        if (cache.hasItems()) {
            return; // Skip if we already have folders in the cache.
        }

        listFolders();
    }, []);

    useEffect(() => {
        return autorun(() => {
            const folders = cache.getItems().map(folder => FolderDtoMapper.toDTO(folder));

            setVm(vm => ({
                ...vm,
                folders
            }));
        });
    }, [cache]);

    useEffect(() => {
        return autorun(() => {
            const loadingState = loading.get();

            setVm(vm => ({
                ...vm,
                loading: loadingState
            }));
        });
    }, [loading]);

    return {
        ...vm,
        listFolders
    };
};

import { useCallback, useMemo } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { LoadingRepository } from "@webiny/app-utils";
import { FoldersCache } from "../cache";
import { ListFoldersRepository } from "./ListFoldersRepository";
import { ListFoldersGqlGateway } from "./ListFoldersGqlGateway";
import { ListFoldersUseCaseWithLoading } from "./ListFoldersUseCaseWithLoading";
import { ListFoldersUseCase } from "./ListFoldersUseCase";

export const useListFolders = (cache: FoldersCache, loading: LoadingRepository, type: string) => {
    const client = useApolloClient();

    const gateway = useMemo(() => {
        return new ListFoldersGqlGateway(client);
    }, [client]);

    const repository = useMemo(() => {
        return new ListFoldersRepository(cache, gateway);
    }, [cache, gateway]);

    const useCase = useMemo(() => {
        const listFolderUseCase = new ListFoldersUseCase(repository);
        return new ListFoldersUseCaseWithLoading(loading, listFolderUseCase);
    }, [repository, loading]);

    const listFolders = useCallback(() => {
        return useCase.execute({ type });
    }, [useCase]);

    return {
        listFolders
    };
};

import { useCallback, useMemo } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { LoadingRepository } from "@webiny/app-utils";
import { FoldersCache } from "../cache";
import { CreateFolderGqlGateway } from "./CreateFolderGqlGateway";
import { CreateFolderRepository } from "./CreateFolderRepository";
import { CreateFolderUseCase } from "./CreateFolderUseCase";
import { CreateFolderUseCaseWithLoading } from "./CreateFolderUseCaseWithLoading";
import { CreateFolderParams } from "./ICreateFolderUseCase";

export const useCreateFolder = (cache: FoldersCache, loading: LoadingRepository, type: string) => {
    const client = useApolloClient();

    const gateway = useMemo(() => {
        return new CreateFolderGqlGateway(client);
    }, [client]);

    const repository = useMemo(() => {
        return new CreateFolderRepository(cache, gateway, type);
    }, [cache, gateway, type]);

    const useCase = useMemo(() => {
        const createFolderUseCase = new CreateFolderUseCase(repository);
        return new CreateFolderUseCaseWithLoading(loading, createFolderUseCase);
    }, [repository, loading]);

    const createFolder = useCallback(
        (params: CreateFolderParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        createFolder
    };
};

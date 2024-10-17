import { useCallback, useMemo } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { FoldersCache } from "../cache";
import { LoadingRepository } from "@webiny/app-utils";
import { DeleteFolderGqlGateway } from "./DeleteFolderGqlGateway";
import { DeleteFolderRepository } from "./DeleteFolderRepository";
import { DeleteFolderUseCase } from "./DeleteFolderUseCase";
import { DeleteFolderUseCaseWithLoading } from "./DeleteFolderUseCaseWithLoading";
import { DeleteFolderParams } from "./IDeleteFolderUseCase";

export const useDeleteFolder = (cache: FoldersCache, loading: LoadingRepository, type: string) => {
    const client = useApolloClient();

    const gateway = useMemo(() => {
        return new DeleteFolderGqlGateway(client);
    }, [client]);

    const repository = useMemo(() => {
        return new DeleteFolderRepository(cache, gateway);
    }, [cache, gateway]);

    const useCase = useMemo(() => {
        const deleteFolderUseCase = new DeleteFolderUseCase(repository);
        return new DeleteFolderUseCaseWithLoading(loading, deleteFolderUseCase);
    }, [repository, loading]);

    const deleteFolder = useCallback(
        (params: DeleteFolderParams) => {
            return useCase.execute({ ...params, type });
        },
        [useCase]
    );

    return {
        deleteFolder
    };
};

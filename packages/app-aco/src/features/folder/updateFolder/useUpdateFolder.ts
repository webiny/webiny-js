import { useCallback, useMemo } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { FoldersCache } from "../cache";
import { UpdateFolderGqlGateway } from "./UpdateFolderGqlGateway";
import { UpdateFolderRepository } from "./UpdateFolderRepository";
import { LoadingRepository } from "@webiny/app-utils";
import { UpdateFolderUseCase } from "./UpdateFolderUseCase";
import { UpdateFolderUseCaseWithLoading } from "./UpdateFolderUseCaseWithLoading";
import { UpdateFolderParams } from "./IUpdateFolderUseCase";

export const useUpdateFolder = (cache: FoldersCache, loading: LoadingRepository) => {
    const client = useApolloClient();

    const gateway = useMemo(() => {
        return new UpdateFolderGqlGateway(client);
    }, [client]);

    const repository = useMemo(() => {
        return new UpdateFolderRepository(cache, gateway);
    }, [cache, gateway]);

    const useCase = useMemo(() => {
        const updateFolderUseCase = new UpdateFolderUseCase(repository);
        return new UpdateFolderUseCaseWithLoading(loading, updateFolderUseCase);
    }, [repository, loading]);

    const updateFolder = useCallback(
        (params: UpdateFolderParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        updateFolder
    };
};

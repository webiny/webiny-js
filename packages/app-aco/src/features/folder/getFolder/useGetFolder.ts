import { useCallback, useMemo } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { LoadingRepository } from "@webiny/app-utils";
import { FoldersCache } from "../cache";
import { GetFolderGqlGateway } from "./GetFolderGqlGateway";
import { GetFolderRepository } from "./GetFolderRepository";
import { GetFolderUseCaseWithLoading } from "./GetFolderUseCaseWithLoading";
import { GetFolderUseCase } from "./GetFolderUseCase";
import { GetFolderParams } from "./IGetFolderUseCase";

export const useGetFolder = (cache: FoldersCache, loading: LoadingRepository) => {
    const client = useApolloClient();

    const gateway = useMemo(() => {
        return new GetFolderGqlGateway(client);
    }, [client]);

    const repository = useMemo(() => {
        return new GetFolderRepository(cache, gateway);
    }, [cache, gateway]);

    const useCase = useMemo(() => {
        const getFolderUseCase = new GetFolderUseCase(repository);
        return new GetFolderUseCaseWithLoading(loading, getFolderUseCase);
    }, [repository, loading]);

    const getFolder = useCallback(
        (params: GetFolderParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    return {
        getFolder
    };
};

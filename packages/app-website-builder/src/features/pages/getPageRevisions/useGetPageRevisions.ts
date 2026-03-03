import { useCallback, useMemo } from "react";
import { useApolloClient } from "@apollo/client/react";
import { GetPageRevisionsGqlGateway } from "./GetPageRevisionsGqlGateway.js";
import type { GetPageRevisionsParams } from "./IGetPageRevisionsUseCase.js";
import { GetPageRevisions } from "./GetPageRevisions.js";

export const useGetPageRevisions = () => {
    const client = useApolloClient();
    const gateway = new GetPageRevisionsGqlGateway(client);

    const getPageRevisionsUseCase = useMemo(() => {
        return GetPageRevisions.getInstance(gateway);
    }, [gateway]);

    const getPageRevisions = useCallback(
        (params: GetPageRevisionsParams) => {
            return getPageRevisionsUseCase.useCase.execute(params);
        },
        [getPageRevisionsUseCase]
    );

    return {
        getPageRevisions,
        loading: getPageRevisionsUseCase.loading.isLoading("WbPageRevisions")
    };
};

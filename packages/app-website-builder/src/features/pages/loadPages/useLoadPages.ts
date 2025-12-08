import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import { ListPagesGqlGateway } from "~/features/pages/loadPages/ListPagesGqlGateway.js";
import { LoadPages } from "~/features/pages/loadPages/LoadPages.js";
import type { LoadPagesUseCaseParams } from "~/features/pages/loadPages/ILoadPagesUseCase.js";

export const useLoadPages = () => {
    const container = useContainer();
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(["properties", "metadata"]);
    const selections = container.resolve()
    const gateway = new ListPagesGqlGateway(client, fields, selections);

    const loadPages = useCallback(
        (params: LoadPagesUseCaseParams) => {
            const instance = LoadPages.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        loadPages
    };
};

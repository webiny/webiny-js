import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLSelection } from "~/features/pages/index.js";
import { ListPagesGqlGateway } from "~/features/pages/loadPages/ListPagesGqlGateway.js";
import { LoadPages } from "~/features/pages/loadPages/LoadPages.js";
import type { LoadPagesUseCaseParams } from "~/features/pages/loadPages/ILoadPagesUseCase.js";
import { useAcoConfig } from "@webiny/app-aco";
import { Sorting } from "@webiny/app-utils";

export const useLoadPages = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLSelection();
    const gateway = new ListPagesGqlGateway(client, fields);
    const { table } = useAcoConfig();

    const loadPages = useCallback(
        (params: LoadPagesUseCaseParams) => {
            if (!table.sorting.length) {
                return null;
            }

            const sorting = table.sorting.map(sort => Sorting.create(sort));

            const instance = LoadPages.getInstance(gateway, sorting);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        loadPages
    };
};

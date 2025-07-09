import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLSelection } from "~/features/pages/index.js";
import { ListPagesGqlGateway } from "~/features/pages/listPages/ListPagesGqlGateway.js";
import { ListPages } from "~/features/pages/listPages/ListPages.js";
import type { ListPagesUseCaseParams } from "~/features/pages/listPages/IListPagesUseCase.js";

export const useListPages = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLSelection();
    const gateway = new ListPagesGqlGateway(client, fields);

    const listPages = useCallback(
        (params: ListPagesUseCaseParams) => {
            const instance = ListPages.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        listPages
    };
};

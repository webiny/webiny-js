import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { ListPagesGqlGateway } from "~/features/pages/listPages/ListPagesGqlGateway.js";
import { useGetPageGraphQLSelection } from "~/features/pages/index.js";
import { ListMorePages } from "~/features/pages/listPages/ListMorePages.js";

export const useListMorePages = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLSelection();
    const gateway = new ListPagesGqlGateway(client, fields);

    const listMorePages = useCallback(() => {
        const instance = ListMorePages.getInstance(gateway);
        return instance.useCase.execute();
    }, [gateway]);

    return {
        listMorePages
    };
};

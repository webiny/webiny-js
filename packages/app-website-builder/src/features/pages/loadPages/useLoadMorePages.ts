import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLFields } from "~/features/pages/index.js";
import { ListPagesGqlGateway } from "~/features/pages/loadPages/ListPagesGqlGateway.js";
import { LoadMorePages } from "~/features/pages/loadPages/LoadMorePages.js";

export const useLoadMorePages = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLFields(["properties", "metadata"]);
    const gateway = new ListPagesGqlGateway(client, fields);

    const loadMorePages = useCallback(() => {
        const instance = LoadMorePages.getInstance(gateway);
        return instance.execute();
    }, [gateway]);

    return {
        loadMorePages
    };
};

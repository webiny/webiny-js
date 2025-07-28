import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetRedirectGraphQLFields } from "~/features/redirects/index.js";
import { ListRedirectsGqlGateway } from "~/features/redirects/loadRedirects/ListRedirectsGqlGateway.js";
import { LoadMoreRedirects } from "~/features/redirects/loadRedirects/LoadMoreRedirects.js";

export const useLoadMoreRedirects = () => {
    const client = useApolloClient();
    const fields = useGetRedirectGraphQLFields();
    const gateway = new ListRedirectsGqlGateway(client, fields);

    const loadMoreRedirects = useCallback(() => {
        const instance = LoadMoreRedirects.getInstance(gateway);
        return instance.execute();
    }, [gateway]);

    return {
        loadMoreRedirects
    };
};

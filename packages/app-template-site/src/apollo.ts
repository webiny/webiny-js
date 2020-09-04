import { ApolloClient, ApolloLink } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { InMemoryCache } from "@apollo/client/cache";
import { createOmitTypenameLink } from "@webiny/app/graphql";

export const createApolloClient = () => {
    const isProduction = process.env.NODE_ENV === "production";

    const cache = new InMemoryCache({
        addTypename: true,
        // TODO: We might need to change this one
        // dataIdFromObject: obj => obj.__typename || null
    });

    if (isProduction && process.env.REACT_APP_ENV === "browser") {
        // Production build of this app will be rendered using SSR so we need to restore cache from pre-rendered state.
        // @ts-ignore
        cache.restore(window.__APOLLO_STATE__);
    }

    const uri = process.env.REACT_APP_GRAPHQL_API_URL;
    const link = ApolloLink.from([createOmitTypenameLink(), new BatchHttpLink({ uri })]);

    return new ApolloClient({ link, cache });
};

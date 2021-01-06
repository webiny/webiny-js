import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createOmitTypenameLink } from "@webiny/app/graphql";
import { plugins } from "@webiny/plugins";

export const createApolloClient = () => {
    const isProduction = process.env.NODE_ENV === "production";

    const cache = new InMemoryCache({
        addTypename: true,
        dataIdFromObject: obj => obj.id || null
    });

    if (isProduction && process.env.REACT_APP_ENV === "browser") {
        // Production build of this app will be rendered using SSR so we need to restore cache from pre-rendered state.
        // @ts-ignore
        cache.restore(window.__APOLLO_STATE__);
    }

    // @ts-ignore
    cache.restore("__APOLLO_STATE__" in window ? window.__APOLLO_STATE__ : {});

    const uri = process.env.REACT_APP_GRAPHQL_API_URL;
    const link = ApolloLink.from([
        createOmitTypenameLink(),
        ...plugins.byType("apollo-link").map(pl => pl.createLink()),
        new BatchHttpLink({ uri })
    ]);

    // @ts-ignore
    window.getApolloState = () => {
        // @ts-ignore
        return cache.data.data;
    };

    return new ApolloClient({ link, cache });
};

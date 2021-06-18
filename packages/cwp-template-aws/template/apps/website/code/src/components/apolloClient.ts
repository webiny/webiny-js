import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloDynamicLink } from "@webiny/app/plugins/ApolloDynamicLink";

export const createApolloClient = () => {
    const cache = new InMemoryCache({
        addTypename: true,
        dataIdFromObject: obj => obj.id || null
    });

    // @ts-ignore
    cache.restore("__APOLLO_STATE__" in window ? window.__APOLLO_STATE__ : {});

    const uri = process.env.REACT_APP_GRAPHQL_API_URL;
    const link = ApolloLink.from([new ApolloDynamicLink(), new BatchHttpLink({ uri })]);

    // @ts-ignore
    window.getApolloState = () => {
        // @ts-ignore
        return cache.data.data;
    };

    return new ApolloClient({ link, cache });
};

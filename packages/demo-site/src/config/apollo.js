import "cross-fetch/polyfill";
import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createOmitTypenameLink } from "webiny-app/graphql";

const cache = new InMemoryCache({
    addTypename: true,
    dataIdFromObject: obj => obj.id || null
});

if (process.env.REACT_APP_SSR !== "true") {
    cache.restore(window.__APOLLO_STATE__);
}

export default new ApolloClient({
    ssrForceFetchDelay: process.env.REACT_APP_SSR !== "true" ? null : 100,
    link: ApolloLink.from([
        createOmitTypenameLink(),
        new BatchHttpLink({ uri: process.env.REACT_APP_API_HOST + "/function/api" })
    ]),
    cache
});

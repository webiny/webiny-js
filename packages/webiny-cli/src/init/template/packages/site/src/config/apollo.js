import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createAuthLink } from "webiny-app-security/components";
import { createOmitTypenameLink } from "webiny-app/graphql";

const isProduction = process.env.NODE_ENV === "production";
const uriPrefix = isProduction ? "" : process.env.REACT_APP_FUNCTIONS_HOST;

const cache = new InMemoryCache({
    addTypename: true,
    dataIdFromObject: obj => obj.id || null
});

if (isProduction && process.env.REACT_APP_ENV === "browser") {
    // Production build of this app will be rendered using SSR so we need to restore cache from pre-rendered state.
    cache.restore(window.__APOLLO_STATE__);
}

export default new ApolloClient({
    link: ApolloLink.from([
        createOmitTypenameLink(),
        createAuthLink(),
        new BatchHttpLink({ uri: uriPrefix + "/function/api" })
    ]),
    cache
});

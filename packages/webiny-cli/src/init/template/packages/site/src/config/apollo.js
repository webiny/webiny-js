import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createAuthLink } from "webiny-app-security/components";
import { createOmitTypenameLink } from "webiny-app/graphql";

let config;

const cache = new InMemoryCache({
    addTypename: true,
    dataIdFromObject: obj => obj.id || null
});

if (process.env.NODE_ENV === "production") {
    config = {
        link: ApolloLink.from([
            createOmitTypenameLink(),
            createAuthLink(),
            new BatchHttpLink({ uri: "/function/api" })
        ]),
        cache
    };
}

if (process.env.NODE_ENV === "development") {
    config = {
        link: ApolloLink.from([
            createOmitTypenameLink(),
            createAuthLink(),
            new BatchHttpLink({ uri: process.env.REACT_APP_API_HOST + "/function/api" })
        ]),
        cache,
        defaultOptions: {
            watchQuery: {
                fetchPolicy: "network-only",
                errorPolicy: "all"
            },
            query: {
                fetchPolicy: "network-only",
                errorPolicy: "all"
            }
        }
    };
}

export default new ApolloClient(config);

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

export default new ApolloClient({
    link: ApolloLink.from([
        createOmitTypenameLink(),
        new BatchHttpLink({ uri: process.env.REACT_APP_API_HOST + "/function/api" })
    ]),
    cache
});

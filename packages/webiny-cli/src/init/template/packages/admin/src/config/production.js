import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createAuthLink } from "webiny-app-security/components";
import { createOmitTypenameLink } from "webiny-app/graphql";

export default {
    apolloClient: new ApolloClient({
        link: ApolloLink.from([
            createOmitTypenameLink(),
            createAuthLink(),
            new BatchHttpLink({ uri: "/function/api" })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            dataIdFromObject: obj => obj.id || null
        })
    })
};

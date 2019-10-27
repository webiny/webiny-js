import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { ErrorLink } from "apollo-link-error";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createAuthLink } from "@webiny/app-security/components";
import { createOmitTypenameLink } from "@webiny/app/graphql";
import { GET_ERROR } from "./NetworkError";

const apolloClient = new ApolloClient({
    link: ApolloLink.from([
        new ErrorLink(({ networkError, operation }) => {
            if (networkError) {
                const { cache } = operation.getContext();
                cache.writeQuery({
                    query: GET_ERROR,
                    data: {
                        networkError: "UNAVAILABLE"
                    }
                });
            }
        }),
        createOmitTypenameLink(),
        createAuthLink(),
        new BatchHttpLink({ uri: process.env.REACT_APP_GRAPHQL_API_URL })
    ]),
    cache: new InMemoryCache({
        addTypename: true,
        dataIdFromObject: obj => obj.id || null
    })
});

export { apolloClient };

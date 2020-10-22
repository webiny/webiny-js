import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { ErrorLink } from "apollo-link-error";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createOmitTypenameLink } from "@webiny/app/graphql";
import { plugins } from "@webiny/plugins";
import { GET_ERROR } from "./NetworkError";

export const createApolloClient = () => {
    return new ApolloClient({
        link: ApolloLink.from([
            /**
             * This link will store information about the error into Apollo Cache. We then use it within `NetworkError`
             * component to render useful information and directions on how to proceed.
             */
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
            /**
             * This link removes `__typename` from the variables being sent to the API.
             */
            createOmitTypenameLink(),
            /**
             * This allows you to register links using plugins. For example, "app-plugin-security-cognito" package
             * adds an authorization header to each request by registering an "apollo-link" plugin.
             */
            ...plugins.byType("apollo-link").map(pl => pl.createLink()),
            /**
             * This batches requests made to the API to pack multiple requests into a single HTTP request.
             */
            new BatchHttpLink({ uri: process.env.REACT_APP_GRAPHQL_API_URL })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            dataIdFromObject: obj => obj.id || null
        })
    });
};

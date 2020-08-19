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
            ...plugins.byType("apollo-link").map(pl => pl.createLink()),
            new BatchHttpLink({ uri: process.env.REACT_APP_GRAPHQL_API_URL })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            dataIdFromObject: obj => obj.id || null
        })
    });
};

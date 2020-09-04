import { ApolloClient, ApolloLink } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { ErrorLink } from "@apollo/client/link/error";
import { InMemoryCache } from "@apollo/client/cache";
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
            // TODO: We might need to modify this
            // dataIdFromObject: obj => obj.__typename || null
        })
    });
};

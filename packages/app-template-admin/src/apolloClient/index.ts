import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { ErrorLink } from "apollo-link-error";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createAuthLink } from "@webiny/app-security/components";
import { createOmitTypenameLink } from "@webiny/app/graphql";
import { GET_ERROR } from "./NetworkError";

export type CreateApolloClient = {
    uri: string;
};

export const createApolloClient = (opts: CreateApolloClient) => {
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
            createAuthLink(),
            new BatchHttpLink({ uri: opts.uri })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            dataIdFromObject: obj => obj.id || null
        })
    });
};

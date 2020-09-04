import { ApolloClient, ApolloLink } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { ErrorLink } from "@apollo/client/link/error";
import { InMemoryCache } from "@apollo/client/cache";
import { createOmitTypenameLink } from "@webiny/app/graphql";
import { plugins } from "@webiny/plugins";
import { GET_ERROR } from "./NetworkError";

export type CreateApolloClient = {
    uri: string;
};

export default (opts: CreateApolloClient) => {
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
            new BatchHttpLink({ uri: opts.uri })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            // TODO: What to do here?
            typePolicies: {}
            // TODO: Maybe remove this completely
            // dataIdFromObject: obj => obj.id || null
        })
    });
};

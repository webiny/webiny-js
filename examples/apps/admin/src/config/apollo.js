import React from "react";
import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { ErrorLink } from "apollo-link-error";
import { InMemoryCache } from "apollo-cache-inmemory";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { createAuthLink } from "@webiny/app-security/components";
import { createOmitTypenameLink } from "@webiny/app/graphql";
import { Alert } from "@webiny/ui/Alert";
import { Elevation } from "@webiny/ui/Elevation";

const GET_ERROR = gql`
    {
        error
    }
`;

export default new ApolloClient({
    link: ApolloLink.from([
        new ErrorLink(({ networkError, operation }) => {
            if (networkError) {
                const { cache } = operation.getContext();
                cache.writeQuery({
                    query: GET_ERROR,
                    data: {
                        error: "Your API seems to be unavailable!"
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

export const NetworkMonitor = ({ children }) => {
    const { data } = useQuery(GET_ERROR, { fetchPolicy: "cache-only" });

    return data && data.error ? (
        <Elevation z={2}>
            <Alert type={"danger"} title={"Network error"}>
                {data.error}
                <br />
                Make sure your API is available at{" "}
                <strong>{process.env.REACT_APP_GRAPHQL_API_URL}</strong>
            </Alert>
        </Elevation>
    ) : (
        children
    );
};

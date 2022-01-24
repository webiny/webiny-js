import React from "react";
import { ApolloProvider as Apollo } from "@apollo/react-components";
import ApolloClient from "apollo-client";

interface Options {
    uri: string;
}

export interface ApolloClientFactory {
    (options: Options): ApolloClient<any>;
}

export const createApolloProvider =
    (clientFactory: ApolloClientFactory) =>
    (Component: React.ComponentType<unknown>): React.FC => {
        return function ApolloProvider({ children }) {
            return (
                <Apollo client={clientFactory({ uri: process.env.REACT_APP_GRAPHQL_API_URL })}>
                    <Component>{children}</Component>
                </Apollo>
            );
        };
    };

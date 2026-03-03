import React from "react";
import { ApolloProvider as Apollo } from "@apollo/client/react";
import type { ApolloClient } from "@apollo/client";

interface Options {
    uri: string;
}

export interface ApolloClientFactory {
    (options: Options): ApolloClient;
}

interface ApolloProviderProps {
    children: React.ReactNode;
}

export const createApolloProvider = (apolloClient: ApolloClient) => {
    return function ApolloProvider({ children }: ApolloProviderProps) {
        return <Apollo client={apolloClient}>{children}</Apollo>;
    };
};

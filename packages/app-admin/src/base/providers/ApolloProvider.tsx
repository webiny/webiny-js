import React from "react";
import { ApolloProvider as Apollo } from "@apollo/react-components";
import type ApolloClient from "apollo-client";

interface Options {
    uri: string;
}

export interface ApolloClientFactory {
    (options: Options): ApolloClient<any>;
}

interface ApolloProviderProps {
    children: React.ReactNode;
}

export const createApolloProvider = (apolloClient: ApolloClient<any>) => {
    return function ApolloProvider({ children }: ApolloProviderProps) {
        return <Apollo client={apolloClient}>{children}</Apollo>;
    };
};

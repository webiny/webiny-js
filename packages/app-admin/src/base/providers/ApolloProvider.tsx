import React from "react";
import { ApolloProvider as Apollo } from "@apollo/react-components";
import ApolloClient from "apollo-client";

interface Options {
    uri: string;
}

export interface ApolloClientFactory {
    (options: Options): ApolloClient<any>;
}

export interface ApolloProviderProps {
    children: React.ReactNode;
}

export const createApolloProvider = (
    clientFactory: ApolloClientFactory
): React.VFC<ApolloProviderProps> => {
    return function ApolloProvider({ children }) {
        const uri = process.env.REACT_APP_GRAPHQL_API_URL as string;
        return <Apollo client={clientFactory({ uri })}>{children}</Apollo>;
    };
};

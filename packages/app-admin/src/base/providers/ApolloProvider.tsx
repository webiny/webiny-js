import React from "react";
import { ApolloProvider as Apollo } from "@apollo/react-components";

export const createApolloProvider = clientFactory => (Component: React.ComponentType<unknown>) => {
    return function ApolloProvider({ children }) {
        return (
            <Apollo client={clientFactory({ uri: process.env.REACT_APP_GRAPHQL_API_URL })}>
                <Component>{children}</Component>
            </Apollo>
        );
    };
};

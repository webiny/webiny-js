import React from "react";
import { ApolloProvider as Apollo } from "@apollo/react-components";

export const createApolloProvider = client => (Component: React.ComponentType<unknown>) => {
    return function ApolloProvider({ children }) {
        return (
            <Apollo client={client}>
                <Component>{children}</Component>
            </Apollo>
        );
    };
};

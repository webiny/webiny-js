import React from "react";
import { Provider } from "@webiny/app-admin";
import { ApolloClient } from "apollo-client";
import { CmsProvider } from "./admin/contexts/Cms";

const createHeadlessCMSProvider = (createApolloClient: CreateApolloClient) => Component => {
    return function HeadlessCMSProvider({ children }) {
        return (
            <CmsProvider createApolloClient={createApolloClient}>
                <Component>{children}</Component>
            </CmsProvider>
        );
    };
};

interface CreateApolloClient {
    (params: { uri: string }): ApolloClient<any>;
}

export interface HeadlessCMSProps {
    createApolloClient: CreateApolloClient;
}

export const HeadlessCMS = ({ createApolloClient }: HeadlessCMSProps) => {
    return <Provider hoc={createHeadlessCMSProvider(createApolloClient)} />;
};

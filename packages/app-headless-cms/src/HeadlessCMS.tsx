import React, { Fragment, memo } from "react";
import { plugins } from "@webiny/plugins";
import { Plugins, Provider } from "@webiny/app-admin";
import { ApolloClient } from "apollo-client";
import { CmsProvider } from "./admin/contexts/Cms";
import { CmsMenuLoader } from "~/admin/menus/CmsMenuLoader";
import apiInformation from "./admin/plugins/apiInformation";

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

const HeadlessCMSExtension = ({ createApolloClient }: HeadlessCMSProps) => {
    plugins.register(apiInformation);

    return (
        <Fragment>
            <Provider hoc={createHeadlessCMSProvider(createApolloClient)} />
            <Plugins>
                <CmsMenuLoader />
            </Plugins>
        </Fragment>
    );
};

export const HeadlessCMS = memo(HeadlessCMSExtension);

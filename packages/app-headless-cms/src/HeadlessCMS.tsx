import React, { Fragment, memo } from "react";
import { plugins } from "@webiny/plugins";
import { Plugins, Provider } from "@webiny/app-admin";
import { ApolloClient } from "apollo-client";
import { CmsProvider } from "./admin/contexts/Cms";
import { CmsMenuLoader } from "~/admin/menus/CmsMenuLoader";
import apiInformation from "./admin/plugins/apiInformation";
import { ContentEntriesModule } from "./admin/views/contentEntries/experiment/ContentEntriesModule";
import { DefaultOnEntryDelete } from "./admin/plugins/entry/DefaultOnEntryDelete";
import { DefaultOnEntryPublish } from "~/admin/plugins/entry/DefaultOnEntryPublish";

const createHeadlessCMSProvider =
    (createApolloClient: CreateApolloClient) =>
    (Component: React.FC): React.FC => {
        return function HeadlessCMSProvider({ children }) {
            return (
                <CmsProvider createApolloClient={createApolloClient}>
                    <Component>{children}</Component>
                </CmsProvider>
            );
        };
    };

interface CreateApolloClientParams {
    uri: string;
}
interface CreateApolloClient {
    (params: CreateApolloClientParams): ApolloClient<any>;
}

export interface HeadlessCMSProps {
    createApolloClient: CreateApolloClient;
}

const HeadlessCMSExtension = ({ createApolloClient }: HeadlessCMSProps) => {
    plugins.register(apiInformation);

    return (
        <Fragment>
            <ContentEntriesModule />
            <Provider hoc={createHeadlessCMSProvider(createApolloClient)} />
            <Plugins>
                <CmsMenuLoader />
                <DefaultOnEntryDelete />
                <DefaultOnEntryPublish />
            </Plugins>
        </Fragment>
    );
};

export const HeadlessCMS = memo(HeadlessCMSExtension);

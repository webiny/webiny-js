import React, { Fragment, memo } from "react";
import { ApolloClient } from "apollo-client";
import { plugins } from "@webiny/plugins";
import { ApolloCacheObjectIdPlugin } from "@webiny/app";
import { Plugins, Provider } from "@webiny/app-admin";
import { CmsProvider } from "~/admin/contexts/Cms";
import { CmsMenuLoader } from "~/admin/menus/CmsMenuLoader";
import apiInformation from "~/admin/plugins/apiInformation";
import { ContentEntriesModule } from "~/admin/views/contentEntries/experiment/ContentEntriesModule";
import { DefaultOnEntryDelete } from "~/admin/plugins/entry/DefaultOnEntryDelete";
import { DefaultOnEntryPublish } from "~/admin/plugins/entry/DefaultOnEntryPublish";
import { PageTemplatesModule } from "~/modules/pageTemplates";

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

    plugins.register(
        new ApolloCacheObjectIdPlugin(obj => {
            if (obj.__typename === "CmsContentModelField") {
                return null;
            }

            return undefined;
        })
    );

    return (
        <Fragment>
            <ContentEntriesModule />
            <PageTemplatesModule />
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

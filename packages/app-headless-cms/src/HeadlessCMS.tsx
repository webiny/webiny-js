import React, { Fragment, memo } from "react";
import { plugins } from "@webiny/plugins";
import { Plugins, Provider } from "@webiny/app-admin";
import { ApolloCacheObjectIdPlugin } from "@webiny/app";
import { ApolloClient } from "apollo-client";
import { CmsProvider } from "./admin/contexts/Cms";
import { CmsMenuLoader } from "~/admin/menus/CmsMenuLoader";
import apiInformation from "./admin/plugins/apiInformation";
import { ContentEntriesModule } from "~/admin/views/contentEntries/ContentEntriesModule";
import { DefaultOnEntryDelete } from "./admin/plugins/entry/DefaultOnEntryDelete";
import { DefaultOnEntryUnpublish } from "~/admin/plugins/entry/DefaultOnEntryUnpublish";
import allPlugins from "./allPlugins";
import { LexicalEditorCmsPlugin } from "~/admin/components/LexicalCmsEditor/LexicalEditorCmsPlugin";

interface HeadlessCMSProvider {
    children: React.ReactNode;
}

const createHeadlessCMSProvider =
    (createApolloClient: CreateApolloClient) => (Component: React.ComponentType) => {
        return function HeadlessCMSProvider({ children }: HeadlessCMSProvider) {
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

/**
 * If there is a problem with some state being reset, it's probably because of this plugin.
 * Check that __typename from the API and the __typename in the state are the same.
 * If not, add it into the attachTypeName array.
 */
const attachTypeName = ["CmsContentEntry", "RefField"];

const HeadlessCMSExtension = ({ createApolloClient }: HeadlessCMSProps) => {
    plugins.register(apiInformation);
    plugins.register(allPlugins);

    plugins.register(
        new ApolloCacheObjectIdPlugin(obj => {
            if (obj.__typename === "CmsContentModelField") {
                return null;
            } else if (obj.__typename && attachTypeName.includes(obj.__typename)) {
                return `${obj.__typename}_${obj.id}`;
            }

            return undefined;
        })
    );

    return (
        <Fragment>
            <ContentEntriesModule />
            <Provider hoc={createHeadlessCMSProvider(createApolloClient)} />
            <Plugins>
                <CmsMenuLoader />
                <DefaultOnEntryDelete />
                <DefaultOnEntryUnpublish />
            </Plugins>
            <LexicalEditorCmsPlugin />
        </Fragment>
    );
};

export const HeadlessCMS = memo(HeadlessCMSExtension);

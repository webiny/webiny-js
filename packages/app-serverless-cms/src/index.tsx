import React, { memo } from "react";
import ApolloClient from "apollo-client";
import { plugins } from "@webiny/plugins";
import { Admin as BaseAdmin, AppInstaller, Shell } from "@webiny/app-admin";
import { Preset } from "@webiny/app-admin/preset";
import { Tenancy } from "@webiny/app-tenancy";
import { Security } from "@webiny/app-security";
import { I18N } from "@webiny/app-i18n";
import { I18NContent } from "@webiny/app-i18n-content";
import { PageBuilder } from "@webiny/app-page-builder";
import { FormBuilder } from "@webiny/app-form-builder";
import { HeadlessCMS } from "@webiny/app-headless-cms";
import { RMWC } from "@webiny/app-admin-rmwc";
import { FileManager } from "@webiny/app-file-manager";
import { GraphQLPlayground } from "@webiny/app-graphql-playground";
import { AccessManagement } from "@webiny/app-security-access-management";
import welcomeScreenPlugins from "@webiny/app-plugin-admin-welcome-screen";
import { imagePlugin } from "@webiny/app/plugins";
import fileManagerPlugins from "@webiny/app-file-manager/admin/plugins";
import fileStorageS3Plugin from "@webiny/app-file-manager-s3";
import { createApolloClient as defaultApolloClientFactory } from "./apolloClientFactory";
import apolloLinks from "./apolloLinks";

interface Options {
    uri: string;
}

interface ApolloClientFactory {
    (options: Options): ApolloClient<any>;
}

export interface AdminProps {
    createApolloClient?: ApolloClientFactory;
    children?: React.ReactNode;
}

const App = (props: AdminProps) => {
    const createApolloClient = props.createApolloClient || defaultApolloClientFactory;

    plugins.register(
        imagePlugin(),
        fileManagerPlugins(),
        fileStorageS3Plugin(),
        apolloLinks,
        welcomeScreenPlugins()
    );

    return (
        <BaseAdmin createApolloClient={createApolloClient}>
            <Shell />
            <RMWC />
            <Preset />
            <Tenancy />
            <Security />
            <AccessManagement />
            <AppInstaller />
            <FileManager />
            <GraphQLPlayground createApolloClient={createApolloClient} />
            <I18N />
            <I18NContent />
            <PageBuilder />
            <FormBuilder />
            <HeadlessCMS createApolloClient={createApolloClient} />
            {props.children}
        </BaseAdmin>
    );
};

export const Admin = memo(App);

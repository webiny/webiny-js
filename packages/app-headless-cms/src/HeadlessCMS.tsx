import React, { Fragment, memo } from "react";
import type { ApolloClient } from "apollo-client";
import { plugins } from "@webiny/plugins";
import { AdminConfig, Provider, RegisterFeature } from "@webiny/app-admin";
import { ApolloCacheObjectIdPlugin } from "@webiny/app";
import { CmsProvider } from "~/admin/contexts/Cms/index.js";
import apiInformation from "~/admin/plugins/apiInformation/index.js";
import { ContentEntriesModule } from "~/admin/views/contentEntries/ContentEntriesModule.js";
import allPlugins from "~/allPlugins.js";
import { LexicalEditorCmsPlugin } from "~/admin/components/LexicalCmsEditor/LexicalEditorCmsPlugin.js";
import { SingletonContentEntryModule } from "~/admin/views/contentEntries/SingletonContentEntryModule.js";
import { RoutesConfig } from "./admin/RoutesConfig.js";
import { CmsSecurityPermission } from "~/admin/plugins/permissionRenderer/index.js";
import { CmsPermissionsFeature } from "~/features/permissions/feature.js";
import { CmsGraphQLClientFeature } from "~/features/graphQLClient/feature.js";
import { ModelFeature } from "~/features/model/feature.js";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { CmsFormModelFeature } from "~/features/formModel/feature.js";
import { ContentEntryFeature } from "~/features/contentEntry/feature.js";
import { CmsFilePickerRenderer } from "~/presentation/fieldRenderers/CmsFilePickerRenderer.js";
import { CmsMultiFilePickerRenderer } from "~/presentation/fieldRenderers/CmsMultiFilePickerRenderer.js";
import { CmsRefInputRenderer } from "~/presentation/fieldRenderers/ref/CmsRefInputRenderer.js";
import { CmsRefInputsRenderer } from "~/presentation/fieldRenderers/ref/CmsRefInputsRenderer.js";
import { CmsRefSimpleSingleRenderer } from "~/presentation/fieldRenderers/ref/CmsRefSimpleSingleRenderer.js";
import { CmsRefSimpleMultipleRenderer } from "~/presentation/fieldRenderers/ref/CmsRefSimpleMultipleRenderer.js";
import { CmsRefDetailedSingleRenderer } from "~/presentation/fieldRenderers/ref/CmsRefDetailedSingleRenderer.js";
import { CmsRefDetailedMultipleRenderer } from "~/presentation/fieldRenderers/ref/CmsRefDetailedMultipleRenderer.js";

interface HeadlessCMSProvider {
    children: React.ReactNode;
}

const createHeadlessCMSProvider =
    (createApolloClient: CreateApolloClient) =>
    (Component: React.ComponentType<React.PropsWithChildren>) => {
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
            <RegisterFeature feature={CmsPermissionsFeature} />
            <RegisterFeature feature={CmsGraphQLClientFeature} />
            <RegisterFeature feature={ModelFeature} />
            <RegisterFeature feature={FormModelFeature} />
            <RegisterFeature feature={CmsFormModelFeature} />
            <RegisterFeature feature={ContentEntryFeature} />
            <RoutesConfig />
            <ContentEntriesModule />
            <SingletonContentEntryModule />
            <Provider hoc={createHeadlessCMSProvider(createApolloClient)} />
            <LexicalEditorCmsPlugin />
            <CmsSecurityPermission />
            <AdminConfig>
                <AdminConfig.Form.FieldRenderer
                    name={"cmsFilePicker"}
                    component={CmsFilePickerRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"cmsMultiFilePicker"}
                    component={CmsMultiFilePickerRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"refInput"}
                    component={CmsRefInputRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"refInputs"}
                    component={CmsRefInputsRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"refSimpleSingle"}
                    component={CmsRefSimpleSingleRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"refSimpleMultiple"}
                    component={CmsRefSimpleMultipleRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"refDetailedSingle"}
                    component={CmsRefDetailedSingleRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"refDetailedMultiple"}
                    component={CmsRefDetailedMultipleRenderer}
                />
            </AdminConfig>
        </Fragment>
    );
};

export const HeadlessCMS = memo(HeadlessCMSExtension);

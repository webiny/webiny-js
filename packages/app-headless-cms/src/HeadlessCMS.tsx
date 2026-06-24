import React, { Fragment, memo } from "react";
import type { ApolloClient } from "apollo-client";
import { plugins } from "@webiny/plugins";
import { AdminConfig, Provider, RegisterFeature } from "@webiny/app-admin";
import { ApolloCacheObjectIdPlugin } from "@webiny/app";
import { CmsProvider } from "~/admin/contexts/Cms/index.js";
import apiInformation from "~/admin/plugins/apiInformation/index.js";
import headlessCmsPlugins from "~/admin/plugins/index.js";
import { LexicalEditorCmsPlugin } from "~/admin/components/LexicalCmsEditor/LexicalEditorCmsPlugin.js";
import { RoutesConfig } from "./admin/RoutesConfig.js";
import { CmsSecurityPermission } from "~/admin/plugins/permissionRenderer/index.js";
import { CmsPermissionsFeature } from "~/features/permissions/feature.js";
import { CmsGraphQLClientFeature } from "~/features/graphQLClient/feature.js";
import { ModelFeature } from "~/features/model/feature.js";
import { ModelGroupFeature } from "~/features/modelGroup/feature.js";
import { ModelGroupPresenterFeature } from "~/presentation/modelGroup/feature.js";
import { ContentGroupsMenuPresenterFeature } from "~/presentation/contentGroupsMenu/feature.js";
import { CmsIconPickerRenderer } from "~/presentation/fieldRenderers/CmsIconPickerRenderer.js";
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
import { CmsFieldRendererFeature } from "~/presentation/fieldRenderers/feature.js";
import { CmsFieldTypeFeature } from "~/presentation/fieldTypes/feature.js";
import { FieldEditorFeature } from "~/presentation/fieldEditor/feature.js";
import { CmsFieldValidatorFeature } from "~/presentation/fieldValidators/feature.js";
import { CmsAppearanceRenderer } from "~/presentation/fieldEditor/renderers/CmsRendererSelectorRenderer.js";
import { CmsPredefinedValuesRenderer } from "~/presentation/fieldEditor/renderers/CmsPredefinedValuesRenderer.js";
import { CmsValidatorItemRenderer } from "~/presentation/fieldEditor/renderers/CmsValidatorsRenderer.js";
import { CmsAccessControlRulesRenderer } from "~/presentation/fieldEditor/renderers/CmsAccessControlRulesRenderer.js";
import { CmsConditionRulesRenderer } from "~/presentation/fieldEditor/renderers/CmsConditionRulesRenderer.js";
import {
    EditTemplateDialog,
    EDIT_DZ_TEMPLATE_DIALOG
} from "~/presentation/fieldTypes/types/dynamicZone/EditTemplateDialog.js";
import { ContentEntriesModule } from "~/ContentEntriesModule.js";

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
    plugins.register(headlessCmsPlugins());

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
            <RegisterFeature feature={ModelGroupFeature} />
            <RegisterFeature feature={ModelGroupPresenterFeature} />
            <RegisterFeature feature={ContentGroupsMenuPresenterFeature} />
            <RegisterFeature feature={FormModelFeature} />
            <RegisterFeature feature={CmsFormModelFeature} />
            <RegisterFeature feature={ContentEntryFeature} />
            <RegisterFeature feature={CmsFieldRendererFeature} />
            <RegisterFeature feature={CmsFieldTypeFeature} />
            <RegisterFeature feature={FieldEditorFeature} />
            <RegisterFeature feature={CmsFieldValidatorFeature} />
            <RoutesConfig />
            <Provider hoc={createHeadlessCMSProvider(createApolloClient)} />
            <LexicalEditorCmsPlugin />
            <CmsSecurityPermission />
            <ContentEntriesModule />
            <AdminConfig>
                <AdminConfig.Dialog
                    name={EDIT_DZ_TEMPLATE_DIALOG}
                    element={<EditTemplateDialog />}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"cmsFilePicker"}
                    component={CmsFilePickerRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"cmsMultiFilePicker"}
                    component={CmsMultiFilePickerRenderer}
                />
                <AdminConfig.Form.FieldRenderer name={"refInput"} component={CmsRefInputRenderer} />
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
                <AdminConfig.Form.FieldRenderer
                    name={"cmsAppearance"}
                    component={CmsAppearanceRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"cmsPredefinedValues"}
                    component={CmsPredefinedValuesRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"cmsValidatorItem"}
                    component={CmsValidatorItemRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"cmsAccessControlRules"}
                    component={CmsAccessControlRulesRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"cmsIconPicker"}
                    component={CmsIconPickerRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"cmsConditionRules"}
                    component={CmsConditionRulesRenderer}
                />
            </AdminConfig>
        </Fragment>
    );
};

export const HeadlessCMS = memo(HeadlessCMSExtension);

import React, { Fragment, memo } from "react";
import { plugins } from "@webiny/plugins";
import { AdminConfig, RegisterFeature } from "@webiny/app-admin";
import apiInformation from "~/admin/plugins/apiInformation/index.js";
import headlessCmsPlugins from "~/admin/plugins/index.js";
import { LexicalEditorCmsPlugin } from "~/admin/components/LexicalCmsEditor/LexicalEditorCmsPlugin.js";
import { RoutesConfig } from "./admin/RoutesConfig.js";
import { CmsSecurityPermission } from "~/admin/plugins/permissionRenderer/index.js";
import { CmsPermissionsFeature } from "~/features/permissions/feature.js";
import { CmsGraphQLClientFeature } from "~/features/graphQLClient/feature.js";
import { ModelFeature } from "~/features/model/feature.js";
import { ListFolderPermissionsTargetsFeature } from "~/features/listFolderPermissionsTargets/feature.js";
import { ModelGroupFeature } from "~/features/modelGroup/feature.js";
import { ModelGroupPresenterFeature } from "~/presentation/modelGroup/feature.js";
import { ContentGroupsMenuPresenterFeature } from "~/presentation/contentGroupsMenu/feature.js";
import { ContentModelsPresenterFeature } from "~/presentation/contentModels/feature.js";
import { NewContentModelPresenterFeature } from "~/presentation/newContentModel/feature.js";
import { CloneContentModelPresenterFeature } from "~/presentation/cloneContentModel/feature.js";
import { ImportContentModelsPresenterFeature } from "~/presentation/importContentModels/feature.js";
import { CmsIconPickerRenderer } from "~/presentation/fieldRenderers/CmsIconPickerRenderer.js";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { CmsFormModelFeature } from "~/features/formModel/feature.js";
import { ContentEntryFeature } from "~/features/contentEntry/feature.js";
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

const HeadlessCMSExtension = () => {
    plugins.register(apiInformation);
    plugins.register(headlessCmsPlugins());

    return (
        <Fragment>
            <RegisterFeature feature={CmsPermissionsFeature} />
            <RegisterFeature feature={CmsGraphQLClientFeature} />
            <RegisterFeature feature={ModelFeature} />
            <RegisterFeature feature={ModelGroupFeature} />
            <RegisterFeature feature={ListFolderPermissionsTargetsFeature} />
            <RegisterFeature feature={ModelGroupPresenterFeature} />
            <RegisterFeature feature={ContentGroupsMenuPresenterFeature} />
            <RegisterFeature feature={ContentModelsPresenterFeature} />
            <RegisterFeature feature={NewContentModelPresenterFeature} />
            <RegisterFeature feature={CloneContentModelPresenterFeature} />
            <RegisterFeature feature={ImportContentModelsPresenterFeature} />
            <RegisterFeature feature={FormModelFeature} />
            <RegisterFeature feature={CmsFormModelFeature} />
            <RegisterFeature feature={ContentEntryFeature} />
            <RegisterFeature feature={CmsFieldRendererFeature} />
            <RegisterFeature feature={CmsFieldTypeFeature} />
            <RegisterFeature feature={FieldEditorFeature} />
            <RegisterFeature feature={CmsFieldValidatorFeature} />
            <RoutesConfig />
            <LexicalEditorCmsPlugin />
            <CmsSecurityPermission />
            <ContentEntriesModule />
            <AdminConfig>
                <AdminConfig.Dialog
                    name={EDIT_DZ_TEMPLATE_DIALOG}
                    element={<EditTemplateDialog />}
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

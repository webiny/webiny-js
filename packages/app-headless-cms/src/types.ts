import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ReactElement, ReactNode } from "react";
import { BindComponent, FormChildrenFunctionParams, Form } from "@webiny/form";
import { ApolloClient } from "apollo-client";
import { IconPrefix, IconName } from "@fortawesome/fontawesome-svg-core";
import { SecurityPermission } from "@webiny/app-security/SecurityIdentity";
import Label from "./admin/views/components/ContentModelForm/ContentFormRender/components/Label";

export type CmsEditorFieldTypePlugin = Plugin & {
    type: "cms-editor-field-type";
    field: {
        type: string;
        label: string;
        validators?: string[];
        description: string;
        icon: React.ReactNode;
        allowMultipleValues: boolean;
        allowPredefinedValues: boolean;
        multipleValuesLabel: React.ReactNode;
        createField: () => CmsEditorField;
        renderSettings?: (params: {
            form: FormChildrenFunctionParams;
            afterChangeLabel: (value: string) => void;
            uniqueFieldIdValidator: (fieldId: string) => void;
            contentModel: CmsEditorContentModel;
        }) => React.ReactNode;
        renderPredefinedValues?: (params: {
            form: FormChildrenFunctionParams;
            getBind: (index?: number) => any;
        }) => React.ReactNode;
        graphql?: {
            queryField?: string;
        };
    };
};

export type CmsEditorFieldRendererPlugin = Plugin & {
    type: "cms-editor-field-renderer";
    renderer: {
        rendererName: string;
        name: React.ReactNode;
        description: React.ReactNode;
        canUse(props: { field: CmsEditorField }): boolean;
        render(props: {
            field: CmsEditorField;
            Label: typeof Label;
            getBind: (index?: number) => any;
            contentModel: CmsEditorContentModel;
        }): React.ReactNode;
    };
};

export type CmsEditorField<T = unknown> = T & {
    id?: string;
    type: string;
    fieldId?: CmsEditorFieldId;
    label?: string;
    helpText?: string;
    placeholderText?: string;
    validation?: CmsEditorFieldValidator[];
    multipleValuesValidation?: CmsEditorFieldValidator[];
    multipleValues?: boolean;
    predefinedValues?: {
        enabled: boolean;
        values: [{ label: string; value: string }];
    };
    settings?: { [key: string]: any };
    renderer: {
        name: string;
    };
};

export type CmsEditorFieldId = string;
export type CmsEditorFieldsLayout = CmsEditorFieldId[][];

export type CmsEditorContentModel = {
    id: CmsEditorFieldId;
    group: {
        id: string;
        name: string;
    };
    version: number;
    layout?: CmsEditorFieldsLayout;
    fields: CmsEditorField[];
    lockedFields: CmsEditorField[];
    name: string;
    modelId: string;
    titleFieldId: string;
    settings: any;
    status: string;
    savedOn: string;
    revisions: any[];
    meta: any;
};

export type CmsEditorContentEntry = {
    id: string;
    savedOn: string;
    [key: string]: any;
    meta: {
        title: string;
        locked: boolean;
        status: "draft" | "published" | "unpublished" | "changesRequested" | "reviewRequested";
        version: number;
    };
};

export type CmsEditorFieldValidator = {
    name: string;
    message: string;
    settings: any;
};

export type CmsEditorFieldValidatorPlugin = Plugin & {
    type: "cms-editor-field-validator";
    validator: {
        name: string;
        label: string;
        description: string;
        defaultMessage: string;
        renderSettings?: (props: {
            Bind: BindComponent;
            setValue: (name: string, value: any) => void;
            setMessage: (message: string) => void;
            data: CmsEditorFieldValidator;
        }) => React.ReactElement;
    };
};

export type CmsEditorContentTab = React.FC<{
    activeTab: boolean;
}>;

// ------------------------------------------------------------------------------------------------------------

export type CmsContentModelFormProps = {
    loading?: boolean;
    onForm?: (form: any) => void;
    contentModel: CmsEditorContentModel;
    entry?: { [key: string]: any };
    onSubmit?: (data: { [key: string]: any }) => any;
    onChange?: (data: { [key: string]: any }) => any;
};

export type CmsEditorFieldOptionPlugin = Plugin & {
    type: "cms-editor-field-option";
    render(): ReactElement;
};

export type CmsContentDetailsPlugin = Plugin & {
    render: (params: any) => ReactNode;
};

export type CmsContentDetailsRevisionContentPlugin = Plugin & {
    type: "cms-content-details-revision-content";
    render(params: any): ReactElement;
};

export type CmsFormFieldPatternValidatorPlugin = Plugin & {
    type: "cms-editor-field-validator-pattern";
    pattern: {
        name: string;
        message: string;
        label: string;
    };
};

export type CmsFormFieldValidator = {
    name: string;
    message: any;
    settings: any;
};

export type CmsFormFieldValidatorPlugin = Plugin & {
    type: "form-field-validator";
    validator: {
        name: string;
        validate: (value: any, validator: CmsFormFieldValidator) => Promise<any>;
    };
};

export type FieldLayoutPositionType = {
    row: number;
    index: number;
};

export type CmsEditorFormSettingsPlugin = Plugin & {
    type: "content-model-editor-form-settings";
    title: string;
    description: string;
    icon: React.ReactElement<any>;
    render(props: { Bind: BindComponent; form: Form; formData: any }): React.ReactNode;
    renderHeaderActions?(props: {
        Bind: BindComponent;
        form: Form;
        formData: any;
    }): React.ReactNode;
};

export type CmsIcon = {
    /**
     * [ pack, icon ], ex: ["fab", "cog"]
     */
    id: [IconPrefix, IconName];
    /**
     * Icon name
     */
    name: string;
    /**
     * SVG element
     */
    svg: ReactElement;
};

export type CmsIconsPlugin = Plugin & {
    type: "cms-icons";
    getIcons(): CmsIcon[];
};

export type FormRenderCmsEditorField = CmsEditorField & {
    validators: Array<(value: any) => boolean>;
};

export type UseContentModelEditorReducerStateType = {
    apolloClient: ApolloClient<any>;
    id: string;
};

export type FormSettingsPluginType = Plugin & {
    title: string;
    description: string;
    icon: React.ReactNode;
    render: FormSettingsPluginRenderFunctionType;
};

export type FormSettingsPluginRenderFunctionType = (props: {
    Bind: BindComponent;
    formData: any; // Content model settings.
    form: any;
}) => React.ReactElement<any>;

export type PermissionRendererPluginRenderFunctionType = (props: {
    value: SecurityPermission;
    setValue: (newValue: SecurityPermission) => void;
}) => React.ReactElement<any>;

export type PermissionRendererCmsManage = Plugin & {
    type: "permission-renderer-cms-manage";
    key: string;
    label: string;
    render: PermissionRendererPluginRenderFunctionType;
};

export type PermissionGroupRendererCMS = Plugin & {
    type: "permission-group-renderer-cms";
    label: string;
    render: ({
        value,
        createSetValue,
        cmsPermissionRendererPlugins
    }: {
        value: any;
        createSetValue: any;
        cmsPermissionRendererPlugins: PermissionRendererCmsManage[];
    }) => React.ReactElement<any>;
};

import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ReactElement, ReactNode } from "react";
import { I18NStringValue, I18NListValue } from "@webiny/app-i18n/types";
import { BindComponent, FormChildrenFunctionParams, Form } from "@webiny/form";
import { ApolloClient } from "apollo-client";
import { IconPrefix, IconName } from "@fortawesome/fontawesome-svg-core";
import Label from "@webiny/app-headless-cms/admin/components/ContentModelForm/ContentFormRender/components/Label";

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
        allowIndexes: {
            singleValue: boolean;
            multipleValues: false; // At the moment, we don't support indexing fields with multiple values.
        };
        multipleValuesLabel: React.ReactNode;
        createField: ({ i18n: any }) => CmsEditorField;
        renderSettings?: (params: {
            form: FormChildrenFunctionParams;
            afterChangeLabel: (value: string) => void;
            uniqueFieldIdValidator: (fieldId: string) => void;
            lockedField?: { [key: string]: any };
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
            locale: string;
            contentModel: CmsEditorContentModel;
        }): React.ReactNode;
    };
};

export type CmsEditorField = {
    _id?: string;
    type: string;
    fieldId?: CmsEditorFieldId;
    label?: I18NStringValue;
    helpText?: I18NStringValue;
    placeholderText?: I18NStringValue;
    validation?: CmsEditorFieldValidator[];
    multipleValuesValidation?: CmsEditorFieldValidator[];
    multipleValues?: boolean;
    predefinedValues?: {
        enabled: boolean;
        values: I18NListValue;
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
    version: number;
    parent: string;
    layout?: CmsEditorFieldsLayout;
    fields: CmsEditorField[];
    name: string;
    modelId: string;
    titleFieldId: string;
    settings: any;
    status: string;
    savedOn: string;
    revisions: any[];
    meta: any;
};

export type CmsEditorFieldValidator = {
    name: string;
    message: I18NStringValue;
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
    locale?: string;
    loading?: boolean;
    onForm?: (form: any) => void;
    contentModel: CmsEditorContentModel;
    content?: { [key: string]: any };
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
    defaultLayoutRenderer: string;
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

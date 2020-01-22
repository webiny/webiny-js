import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ReCaptchaComponent } from "@webiny/app-form-builder/components/Form/components/createReCaptchaComponent";
import { TermsOfServiceComponent } from "@webiny/app-form-builder/components/Form/components/createTermsOfServiceComponent";
import { I18NStringValue } from "@webiny/app-i18n/types";
import {
    BindComponent,
    FormChildrenFunctionParams,
    Form,
    FormChildrenFunctionParamsSubmit
} from "@webiny/form";
import { ApolloClient } from "apollo-client";

export type FbBuilderFieldValidator = {
    name: string;
    message: I18NStringValue;
    settings: any;
};

export type FbBuilderFormFieldValidatorPlugin = Plugin & {
    type: "form-editor-field-validator";
    validator: {
        name: string;
        label: string;
        description: string;
        defaultMessage: string;
        renderSettings?: (props: {
            Bind: BindComponent;
            setValue: (name: string, value: any) => void;
            setMessage: (message: string) => void;
            data: FbBuilderFieldValidator;
        }) => React.ReactElement;
    };
};

export type FbFormFieldPatternValidatorPlugin = Plugin & {
    type: "form-editor-field-validator-pattern";
    pattern: {
        name: string;
        message: string;
        label: string;
    };
};

export type FbFormFieldValidator = {
    name: string;
    message: any;
    settings: any;
};

export type FbFormFieldValidatorPlugin = Plugin & {
    type: "form-field-validator";
    validator: {
        name: string;
        validate: (value: any, validator: FbFormFieldValidator) => Promise<any>;
    };
};

export type FieldIdType = string;
export type FbFormModelFieldsLayout = FieldIdType[][];

export type FieldLayoutPositionType = {
    row: number;
    index: number;
};

export type FbBuilderFieldPlugin = Plugin & {
    type: "form-editor-field-type";
    field: {
        group?: string;
        unique?: boolean;
        type: string;
        name: string;
        label: string;
        validators?: string[];
        description: string;
        icon: React.ReactNode;
        createField: ({ i18n: any }) => FbFormModelField;
        renderSettings?: (params: {
            form: FormChildrenFunctionParams;
            afterChangeLabel: (value: string) => void;
            uniqueFieldIdValidator: (fieldId: string) => void;
        }) => React.ReactNode;
    };
};

export type FbFormDetailsPluginRenderParams = {
    refreshForms: () => Promise<void>;
    form: FbFormModel;
    loading: boolean;
};

export type FbFormDetailsPluginType = Plugin & {
    type: "forms-form-details-revision-content";
    render: (props: FbFormDetailsPluginRenderParams) => React.ReactNode;
};

export type FbFormDetailsSubmissionsPlugin = Plugin & {
    type: "forms-form-details-submissions";
    render: (props: { form: FbFormModel }) => React.ReactNode;
};

export type FbFormModel = {
    id: FieldIdType;
    version: number;
    parent: string;
    layout: FbFormModelFieldsLayout;
    fields: FbFormModelField[];
    name: string;
    settings: any;
    status: string;
    savedOn: string;
    revisions: any[];
    overallStats: {
        submissions: number;
        views: number;
        conversionRate: number;
    };
};

export type FbFormModelField = {
    _id?: string;
    type: string;
    name: string;
    fieldId?: FieldIdType;
    label?: I18NStringValue;
    helpText?: I18NStringValue;
    placeholderText?: I18NStringValue;
    validation?: FbBuilderFieldValidator[];
    options?: Array<{ value: string; label: I18NStringValue }>;
    settings: {[key: string]: any};
};

export type FbFormSubmissionData = {
    data: any;
    form: {
        revision: FbFormModel;
    };
};

export type FbFormTriggerHandlerPlugin = Plugin & {
    type: "form-trigger-handler";
    trigger: {
        id: string;
        handle: (params: { trigger: any; data: any; form: FbFormModel }) => void;
    };
};

export type FbEditorFormSettingsPlugin = Plugin & {
    type: "form-editor-form-settings";
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

export type FbEditorFieldGroup = Plugin & {
    type: "form-editor-field-group";
    group: {
        title: string;
    };
};

export type FbFormLayoutPlugin = Plugin & {
    type: "form-layout";
    layout: {
        name: string;
        title: string;
        component: React.ComponentType<any>;
    };
};

export type FbEditorTrigger = Plugin & {
    type: "form-editor-trigger";
    trigger: {
        id: string;
        title: string;
        description: string;
        icon: React.ReactElement<any>;
        renderSettings(params: {
            Bind: BindComponent;
            submit: FormChildrenFunctionParamsSubmit;
            form: FbFormModel;
        }): React.ReactElement<any>;
    };
};

// ------------------------------------------------------------------------------------------------------------

export type FormRenderFbFormModelField = FbFormModelField & {
    validators: Array<(value: any) => boolean>;
};

export type FormRenderPropsType = {
    getFieldById: Function;
    getFieldByFieldId: Function;
    getFields: () => Array<Array<FormRenderFbFormModelField>>;
    getDefaultValues: () => { [key: string]: any };
    ReCaptcha: ReCaptchaComponent;
    TermsOfService: TermsOfServiceComponent;
    submit: (data: Object) => Promise<FormSubmitResponseType>;
    formData: FbFormModel;
};

export type FormLayoutComponent = (props: FormRenderPropsType) => React.ReactNode;

export type FormComponentPropsType = {
    preview?: boolean;
    data?: any;
    revisionId?: string;
    parentId?: string;
    slug?: string;
};

export type FbFormRenderComponentProps = {
    preview?: boolean;
    data?: FbFormModel;
};

export type FormSubmitResponseType = {
    data: any;
    preview: boolean;
    error: {
        message: string;
        code: string;
    };
};

export type FormLoadComponentPropsType = {
    preview?: boolean;
    revisionId?: string;
    parentId?: string;
    slug?: string;
    version?: number;
};

export type UseFormEditorReducerStateType = {
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
    formData: any; // Form settings.
    form: any;
}) => React.ReactElement<any>;

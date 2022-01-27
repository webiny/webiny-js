import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ReCaptchaComponent } from "./components/Form/components/createReCaptchaComponent";
import { TermsOfServiceComponent } from "./components/Form/components/createTermsOfServiceComponent";
import {
    BindComponent,
    FormRenderPropParams,
    FormRenderPropParamsSubmit,
    FormAPI
} from "@webiny/form/types";
import { ApolloClient } from "apollo-client";
import { SecurityContext } from "@webiny/app-security";

export type FbBuilderFieldValidator = {
    name: string;
    message: string;
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

export type FbBuilderFormFieldPatternValidatorPlugin = Plugin & {
    type: "form-editor-field-validator-pattern";
    pattern: {
        name: string;
        message: string;
        label: string;
    };
};

export type FbFormFieldPatternValidatorPlugin = Plugin & {
    type: "fb-form-field-validator-pattern";
    pattern: {
        name: string;
        regex: string;
        flags: string;
    };
};

export type FbFormFieldValidator = {
    name: string;
    message: any;
    settings: any;
};

export type FbFormFieldValidatorPlugin = Plugin & {
    type: "fb-form-field-validator";
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
        createField: (props?: { [key: string]: any }) => FbFormModelField;
        renderSettings?: (params: {
            form: FormRenderPropParams;
            afterChangeLabel: (value: string) => void;
            uniqueFieldIdValidator: (fieldId: string) => void;
        }) => React.ReactNode;
    };
};

export type FbRevisionModel = {
    id: string;
    name: string;
    version: number;
    published: boolean;
    status: string;
    savedOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
};

export type FbFormDetailsPluginRenderParams = {
    security: SecurityContext;
    refreshForms: () => Promise<void>;
    form: FbFormModel;
    revisions: FbRevisionModel[];
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
    revisions: FbRevisionModel[];
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
    label?: string;
    helpText?: string;
    placeholderText?: string;
    validation?: FbBuilderFieldValidator[];
    options?: Array<{ value: string; label: string }>;
    settings: { [key: string]: any };
};

export type FbFormSubmissionData = {
    id: string;
    locale: string;
    data: Record<string, any>;
    meta: Record<string, any>;
    form: {
        id: string;
        parent: string;
        name: string;
        version: number;
        fields: Record<string, any>[];
        layout: string[][];
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
    render(props: { Bind: BindComponent; form: FormAPI; formData: any }): React.ReactNode;
    renderHeaderActions?(props: {
        Bind: BindComponent;
        form: FormAPI;
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
            submit: FormRenderPropParamsSubmit;
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
    client?: ApolloClient<any>;
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

import React from "react";
import { GetFormDataLoader, LogFormViewDataLoader, SubmitFormDataLoader } from "./dataLoaders";

export type FieldIdType = string;
export type FormDataFieldsLayout = FieldIdType[][];

export interface FbBuilderFieldValidator {
    name: string;
    message: string;
    settings: any;
}

export interface FormDataField {
    _id?: string;
    type: string;
    name: string;
    fieldId: FieldIdType;
    label?: string;
    helpText?: string;
    placeholderText?: string;
    validation?: FbBuilderFieldValidator[];
    options?: Array<{ value: string; label: string }>;
    settings: {
        defaultValue?: string | string[];
        rows?: number;
        [key: string]: any;
    };
}

export interface FormData {
    id: string;
    version: number;
    parent: string;
    layout: FormDataFieldsLayout;
    fields: FormDataField[];
    published: boolean;
    name: string;
    settings: any;
    status: string;
    savedOn: string;
    overallStats: {
        submissions: number;
        views: number;
        conversionRate: number;
    };
    triggers: Record<string, any>;
}

export type RenderFormComponentDataField = FormDataField & {
    validators: ((value: string) => Promise<boolean>)[];
};

export interface ErrorResponse {
    message: string;
    code?: string | null;
    data?: Record<string, any>;
}

export type FormLayoutComponentProps<T = any> = {
    getFieldById: Function;
    getFieldByFieldId: Function;
    getFields: () => RenderFormComponentDataField[][];
    getDefaultValues: () => { [key: string]: any };
    ReCaptcha: ReCaptchaComponent;
    TermsOfService: TermsOfServiceComponent;
    submit: (data: T) => Promise<FormSubmissionResponse>;
    formData: FormData;
};

export type FormLayoutComponent = React.ComponentType<FormLayoutComponentProps>;

interface ReCaptchaChildrenFunction {
    ({ errorMessage }: { errorMessage: string }): React.ReactNode;
}

export type ReCaptchaProps = {
    children?: React.ReactNode | ReCaptchaChildrenFunction;
    onChange?: (value: string) => void;
    onErrored?: Function;
    onExpired?: Function;
};

export type ReCaptchaComponent = React.FC<ReCaptchaProps>;

export type TermsOfServiceChildrenFunction = (params: {
    onChange: (value: boolean) => void;
    errorMessage: String;
    // Should be `OutputBlockData` from `@editorjs/editorjs`, but didn't want to introduce an extra dependency.
    message: any;
}) => React.ReactNode;

export interface TermsOfServiceProps {
    children: TermsOfServiceChildrenFunction;
    onChange?: (value: string) => void;
    onErrored?: Function;
    onExpired?: Function;
}

export type TermsOfServiceComponent = React.FC<TermsOfServiceProps>;

export type FormSubmissionFieldValues = Record<string, any>;

export interface FormSubmission {
    id: string;
    locale: string;
    data: FormSubmissionFieldValues;
    meta: {
        ip: string;
        submittedOn: string;
    };
    form: {
        id: string;
        parent: string;
        name: string;
        version: number;
        fields: FormDataField[];
        layout: string[][];
    };
}

export interface FormSubmissionResponse {
    data: any;
    preview: boolean;
    error: ErrorResponse | null;
}

export interface FbFormFieldValidator {
    name: string;
    message: any;
    settings: any;
}

export type FbFormFieldValidatorPlugin = Plugin & {
    type: "fb-form-field-validator";
    validator: {
        name: string;
        validate: (value: string, validator: FbFormFieldValidator) => Promise<any>;
    };
};

export interface CreateFormParamsFormLayoutComponent {
    id: string;
    name: string;
    component: FormLayoutComponent;
}

export interface CreateFormParamsTrigger {
    id: string;
    name: string;
    handle: any;
}

export interface CreateFormParamsDataLoaders {
    getForm: GetFormDataLoader;
    submitForm: SubmitFormDataLoader;
    logFormView: LogFormViewDataLoader;
}

export interface CreateFormParams {
    preview?: boolean;
    dataLoaders: CreateFormParamsDataLoaders;
    formLayoutComponents:
        | CreateFormParamsFormLayoutComponent[]
        | (() => CreateFormParamsFormLayoutComponent[]);
    fieldValidators?: any[];
    triggers?: CreateFormParamsTrigger[] | (() => CreateFormParamsTrigger[]);
}

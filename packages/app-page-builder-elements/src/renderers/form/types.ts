import React from "react";
import { GetFormDataLoader, LogFormViewDataLoader, SubmitFormDataLoader } from "./dataLoaders";

export type FieldIdType = string;
export type FormDataFieldsLayout = FieldIdType[][];

export interface FormDataFieldValidator {
    name: string;
    message: string;
    settings: any;
}

export interface FormDataField {
    _id: string;
    type: string;
    name: string;
    fieldId: FieldIdType;
    label?: string;
    helpText?: string;
    placeholderText?: string;
    validation?: FormDataFieldValidator[];
    options?: Array<{ value: string; label: string }>;
    settings: {
        defaultValue?: string | string[];
        rows?: number;
        [key: string]: any;
    };
}

export interface FormDataCreatedBy {
    id: string;
    displayName: string;
    type: string;
}

export interface FormDataRevision {
    id: string;
    name: string;
    version: number;
    status: string;
    savedOn: string;
    createdBy: FormDataCreatedBy;
}

export interface FormDataStep {
    id: string;
    title: string;
    layout: string[][];
}

export interface FormData {
    id: string;
    formId: string;
    version: number;
    fields: FormDataField[];
    steps: FormDataStep[];
    name: string;
    settings: any;
    status: string;
    savedOn: string;
    revisions: FormDataRevision[];
    createdBy: FormDataCreatedBy;
    triggers: Record<string, any>;
}

export type FormRenderComponentDataField = FormDataField & {
    validators: ((value: string) => Promise<boolean>)[];
};

export interface ErrorResponse {
    message: string;
    code?: string | null;
    data?: Record<string, any>;
}

export type FormLayoutComponentProps<T = any> = {
    getFieldById: (id: string) => FormDataField | null;
    getFieldByFieldId: (id: string) => FormDataField | null;
    getFields: (stepIndex?: number) => FormRenderComponentDataField[][];
    getDefaultValues: () => { [key: string]: any };
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    isLastStep: boolean;
    isFirstStep: boolean;
    isMultiStepForm: boolean;
    currentStepIndex: number;
    currentStep: FormDataStep;
    ReCaptcha: ReCaptchaComponent;
    reCaptchaEnabled: boolean;
    TermsOfService: TermsOfServiceComponent;
    termsOfServiceEnabled: boolean;
    submit: (data: T) => Promise<FormSubmissionResponse>;
    formData: FormData;
};

export type FormLayoutComponent = React.ComponentType<FormLayoutComponentProps>;

export interface ReCaptchaChildrenFunction {
    ({ errorMessage }: { errorMessage: string }): React.ReactNode;
}

export type ReCaptchaProps = {
    children?: React.ReactNode | ReCaptchaChildrenFunction;
    onChange?: (value: string) => void;
    onErrored?: (...args: any[]) => void;
    onExpired?: (...args: any[]) => void;
};

export type ReCaptchaComponent = React.ComponentType<ReCaptchaProps>;

export type TermsOfServiceChildrenFunction = (params: {
    onChange: (value: boolean) => void;
    errorMessage: string;
    // Should be `OutputBlockData` from `@editorjs/editorjs`, but didn't want to introduce an extra dependency.
    message: any;
}) => React.ReactNode;

export interface TermsOfServiceProps {
    children: TermsOfServiceChildrenFunction;
    onChange?: (value: string) => void;
    onErrored?: (...args: any[]) => void;
    onExpired?: (...args: any[]) => void;
}

export type TermsOfServiceComponent = React.ComponentType<TermsOfServiceProps>;

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

export interface CreateFormParamsValidator {
    id: string;
    name: string;
    validate: (value: string, validator: FormDataFieldValidator) => Promise<any>;
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
    fieldValidators?: CreateFormParamsValidator[] | (() => CreateFormParamsValidator[]);
    triggers?: CreateFormParamsTrigger[] | (() => CreateFormParamsTrigger[]);
    renderFormNotSelected?: React.FC;
    renderFormLoading?: React.FC;
    renderFormNotFound?: React.FC;
}

import { Plugin } from "@webiny/graphql/types";
type FbFormTriggerData = { [key: string]: any };
type FbFormSubmissionData = { [key: string]: any };

type FbFormFieldValidator = {
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

export type FbFormFieldPatternValidatorPlugin = Plugin & {
    type: "form-field-validator-pattern";
    pattern: {
        name: string;
        regex: string;
        flags: string;
    };
};

export type FbFormTriggerHandlerParams = {
    formSubmission: { [key: string]: any }; // TODO: FormSubmission model instance
    trigger: FbFormTriggerData;
    data: FbFormSubmissionData;
    form: { [key: string]: any }; // TODO: Form model instance
};

export type FbFormTriggerHandlerPlugin = Plugin & {
    type: "form-trigger-handler";
    trigger: string;
    handle: (args: FbFormTriggerHandlerParams) => Promise<void>;
};

type FbFormFileResult = {
    data: {
        data: any;
        file: any;
    };
    error?: {
        message: string;
        code: number;
    };
};
export type FbFormUploadedFileResult = {
    files?: {
        uploadFile?: FbFormFileResult;
    };
};

export type FbFormCreatedFileResult = {
    files?: {
        createFile?: FbFormFileResult;
    };
};

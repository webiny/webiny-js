import { Plugin } from "@webiny/api/types";

type FbFormTriggerData = { [key: string]: any };
type FbFormSubmissionData = { [key: string]: any };

type FbFormFieldValidator = {
    name: string;
    message: any;
    settings: any;
};

export type FbFormFieldValidatorPlugin = Plugin & {
    validator: {
        name: string;
        validate: (value: any, validator: FbFormFieldValidator) => Promise<any>;
    };
};

export type FbFormFieldPatternValidatorPlugin = Plugin & {
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
    trigger: string;
    handle: (args: FbFormTriggerHandlerParams) => Promise<void>;
};

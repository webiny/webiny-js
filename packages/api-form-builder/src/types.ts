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

/**
 * Used to define custom business logic that gets executed upon successful form submission (e.g. send data to a specific e-mail address).
 * @see https://docs.webiny.com/docs/webiny-apps/form-builder/development/plugins-reference/api#form-trigger-handler
 */
export type FbFormTriggerHandlerPlugin = Plugin & {
    type: "form-trigger-handler";
    trigger: string;
    handle: (args: FbFormTriggerHandlerParams) => Promise<void>;
};

export type Form = {
    id: string;
    createdBy: CreatedBy;
    savedOn: string;
    createdOn: string;
    name: string;
    slug: string;
    version: number;
    parent: string;
    locked: boolean;
    published: boolean;
    publishedOn: string;
    latestVersion: boolean;
    status: string;
    fields: Record<string, any>[];
    layout: [string[]];
    stats: Record<string, any>;
    settings: Record<string, any>;
    triggers: Record<string, any>;
};

export type CreatedBy = {
    id: string;
    displayName: string;
    type: string;
};

export type FormCreateData = {
    name: string;
};

export type FormUpdateData = {
    name: string;
    fields: Record<string, any>[];
    layout: [string[]];
    settings: Record<string, any>;
    triggers: Record<string, any>;
};

export type Sort = {
    SK: 1 | -1;
};

export type FormsCRUD = {
    getForm(id: string): Promise<Form>;
    listAllForms(sort: Sort): Promise<Form[]>;
    listFormsBeginsWithId({
        id,
        sort
    }: {
        id: string;
        sort?: Sort;
        [key: string]: any;
    }): Promise<Form[]>;
    listFormsInBatch(ids: string[]): Promise<Form[]>;
    createForm(data: FormCreateData): Promise<Form>;
    updateForm(id: string, data: Partial<FormUpdateData>): Promise<boolean>;
    deleteForm(id: string): Promise<boolean>;
    deleteForms(ids: string[]): Promise<boolean>;
    publishForm(id: string): Promise<boolean>;
    unPublishForm(id: string): Promise<boolean>;
    createFormRevision(revision: Form): Promise<Form>;
    getNextVersion(id: string): Promise<number>;
    markPreviousLatestVersion({
        parentId,
        version,
        latestVersion
    }: {
        parentId: string;
        version: number;
        latestVersion: boolean;
    }): Promise<boolean>;
    saveFormStats(id: string, stats: any): Promise<boolean>;
    submit({
        form,
        reCaptchaResponseToken,
        data,
        meta
    }: {
        form: Form;
        reCaptchaResponseToken: string;
        data: any;
        meta: any;
    }): Promise<FormSubmission>;
};

export type FormSubmission = {
    id: string;
    data: Record<string, any>;
    meta: Record<string, any>;
    form: {
        parent: string;
        revision: string;
    };
    logs: Record<string, any>[];
};

export type FormSubmissionCreateData = {
    form: {
        parent: string;
        revision: string;
    };
    data: Record<string, any>;
    reCaptchaResponseToken: string;
    meta: Record<string, any>;
};

export type FormSubmissionsCRUD = {
    getSubmission({
        formId,
        submissionId
    }: {
        formId: string;
        submissionId: string;
    }): Promise<FormSubmission>;
    listAllSubmissions({ formId, sort }: { formId: string; sort: Sort }): Promise<FormSubmission[]>;
    createSubmission(data: FormSubmissionCreateData): Promise<FormSubmission>;
    updateSubmission({ formId, data }: { formId: string; data: FormSubmission }): Promise<boolean>;
    deleteSubmission({
        formId,
        submissionId
    }: {
        formId: string;
        submissionId: string;
    }): Promise<boolean>;
    addLog(formSubmission: FormSubmission, log: Record<string, any>): FormSubmission;
};

export type FormSubmissionUpdateData = {
    logs: Record<string, any>;
};

export type FormBuilderSettings = {
    key: "form-builder";
    installed: boolean;
    domain: string;
    reCaptcha: {
        enabled: boolean;
        siteKey: string;
        secretKey: string;
    };
};

export type FormBuilderSettingsUpdateData = {
    domain: string;
    reCaptcha: {
        enabled: boolean;
        siteKey: string;
        secretKey: string;
    };
};

export type FormBuilderSettingsCRUD = {
    getSettings(): Promise<FormBuilderSettings>;
    createSettings(data: FormBuilderSettings): Promise<FormBuilderSettings>;
    updateSettings(data: FormBuilderSettingsUpdateData): Promise<boolean>;
    deleteSettings(): Promise<boolean>;
};

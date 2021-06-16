import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/handler/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";
import { SecurityPermission } from "@webiny/api-security/types";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { I18NContext } from "@webiny/api-i18n/types";

type FbFormTriggerData = Record<string, any>;
type FbSubmissionData = Record<string, any>;

type FbFormFieldValidator = {
    name: string;
    message: any;
    settings: Record<string, any>;
};

export type FbFormFieldValidatorPlugin = Plugin & {
    type: "fb-form-field-validator";
    validator: {
        name: string;
        validate: (value: any, validator: FbFormFieldValidator) => Promise<any>;
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

export type FbFormTriggerHandlerParams = {
    addLog: (log: Record<string, any>) => void;
    trigger: FbFormTriggerData;
    data: FbSubmissionData;
    form: FbForm;
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

export type FbForm = {
    id: string;
    tenant: string;
    locale: string;
    createdBy: CreatedBy;
    ownedBy: OwnedBy;
    savedOn: string;
    createdOn: string;
    name: string;
    slug: string;
    version: number;
    locked: boolean;
    published: boolean;
    publishedOn: string;
    status: string;
    fields: Record<string, any>[];
    layout: string[][];
    stats: Record<string, any>;
    settings: Record<string, any>;
    triggers: Record<string, any>;
};

export type CreatedBy = {
    id: string;
    displayName: string;
    type: string;
};

export type OwnedBy = CreatedBy;

type FormCreateInput = {
    name: string;
};

type FormUpdateInput = {
    name: string;
    fields: Record<string, any>[];
    layout: string[][];
    settings: Record<string, any>;
    triggers: Record<string, any>;
};

type FbFormStats = {
    submissions: number;
    views: number;
    conversionRate: number;
};

type FbSubmissionsSort = Record<"createdOn", 1 | -1>;

type FbListSubmissionsOptions = {
    limit?: number;
    after?: string;
    sort?: FbSubmissionsSort;
};

export type FbListSubmissionsMeta = {
    cursor: string;
    hasMoreItems: boolean;
    totalCount: number;
};

export type FormsCRUD = {
    getForm(id: string): Promise<FbForm>;
    getFormStats(id: string): Promise<FbFormStats>;
    listForms(): Promise<FbForm[]>;
    createForm(data: FormCreateInput): Promise<FbForm>;
    updateForm(id: string, data: Partial<FormUpdateInput>): Promise<FbForm>;
    deleteForm(id: string): Promise<boolean>;
    publishForm(id: string): Promise<FbForm>;
    unpublishForm(id: string): Promise<FbForm>;
    createFormRevision(fromRevisionId: string): Promise<FbForm>;
    incrementFormViews(id: string): Promise<boolean>;
    incrementFormSubmissions(id: string): Promise<boolean>;
    getFormRevisions(id: string): Promise<FbForm[]>;
    getPublishedFormRevisionById(revisionId: string): Promise<FbForm>;
    getLatestPublishedFormRevision(formId: string): Promise<FbForm>;
    deleteRevision(id: string): Promise<boolean>;
    getSubmissionsByIds(formId: string, submissionIds: string[]): Promise<FbSubmission[]>;
    listFormSubmissions(
        formId: string,
        options: FbListSubmissionsOptions
    ): Promise<[FbSubmission[], FbListSubmissionsMeta]>;
    createFormSubmission(
        formId: string,
        reCaptchaResponseToken: string,
        data: any,
        meta: any
    ): Promise<FbSubmission>;
    updateSubmission(formId: string, data: FbSubmission): Promise<boolean>;
    deleteSubmission(formId: string, submissionId: string): Promise<boolean>;
};

export type SystemCRUD = {
    getVersion(): Promise<string>;
    setVersion(version: string): Promise<void>;
    install(args: { domain?: string }): Promise<void>;
    upgrade(version: string, data?: Record<string, any>): Promise<boolean>;
};

export type FbSubmission = {
    id: string;
    locale: string;
    ownedBy: OwnedBy;
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
    logs: Record<string, any>[];
};

export type SubmissionInput = {
    data: Record<string, any>;
    meta: Record<string, any>;
    reCaptchaResponseToken: string;
};

export type SubmissionUpdateData = {
    logs: Record<string, any>;
};

export type Settings = {
    key: "form-builder";
    domain: string;
    reCaptcha: {
        enabled: boolean;
        siteKey: string;
        secretKey: string;
    };
};

export type SettingsCRUD = {
    getSettings(options?: { auth: boolean }): Promise<Settings>;
    createSettings(data: Partial<Settings>): Promise<Settings>;
    updateSettings(data: Partial<Settings>): Promise<Settings>;
};

export interface FbFormPermission extends SecurityPermission {
    name: "fb.form";
    rwd: string;
    pw: string;
    own: boolean;
    submissions: boolean;
}

export interface FbFormSettingsPermission extends SecurityPermission {
    name: "fb.settings";
}

export type FormBuilderContext = Context<
    TenancyContext,
    I18NContext,
    I18NContentContext,
    FileManagerContext,
    ElasticSearchClientContext,
    {
        formBuilder: {
            forms: FormsCRUD;
            settings: SettingsCRUD;
            system: SystemCRUD;
        };
    }
>;

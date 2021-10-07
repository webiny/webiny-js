import { Plugin } from "@webiny/plugins/types";
import { TenancyContext, Tenant } from "@webiny/api-tenancy/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { SecurityPermission } from "@webiny/api-security/types";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { Topic } from "@webiny/pubsub/types";

interface FbFormTriggerData {
    [key: string]: any;
}
interface FbSubmissionData {
    [key: string]: any;
}

interface FbFormFieldValidator {
    name: string;
    message: any;
    settings: Record<string, any>;
}

export interface FbFormFieldValidatorPlugin extends Plugin {
    type: "fb-form-field-validator";
    validator: {
        name: string;
        validate: (value: any, validator: FbFormFieldValidator) => Promise<any>;
    };
}

export interface FbFormFieldPatternValidatorPlugin extends Plugin {
    type: "fb-form-field-validator-pattern";
    pattern: {
        name: string;
        regex: string;
        flags: string;
    };
}

export interface FbFormTriggerHandlerParams {
    addLog: (log: Record<string, any>) => void;
    trigger: FbFormTriggerData;
    data: FbSubmissionData;
    form: FbForm;
}

/**
 * Used to define custom business logic that gets executed upon successful form submission (e.g. send data to a specific e-mail address).
 * @see https://docs.webiny.com/docs/webiny-apps/form-builder/development/plugins-reference/api#form-trigger-handler
 */
export interface FbFormTriggerHandlerPlugin extends Plugin {
    type: "form-trigger-handler";
    trigger: string;
    handle: (args: FbFormTriggerHandlerParams) => Promise<void>;
}

export interface FbForm {
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
    stats: Omit<FbFormStats, "conversionRate">;
    settings: Record<string, any>;
    triggers: Record<string, any>;
    /**
     * The ID that connects all form revisions.
     * TODO: Add via upgrade for 5.16.0 to both DynamoDB and Elasticsearch. (formId and webinyVersion)
     */
    formId: string;
    webinyVersion: string;
}

export interface CreatedBy {
    id: string;
    displayName: string;
    type: string;
}

export type OwnedBy = CreatedBy;

interface FormCreateInput {
    name: string;
}

interface FormUpdateInput {
    name: string;
    fields: Record<string, any>[];
    layout: string[][];
    settings: Record<string, any>;
    triggers: Record<string, any>;
}

export interface FbFormStats {
    submissions: number;
    views: number;
    conversionRate: number;
}

type FbSubmissionsSort = Record<"createdOn", 1 | -1>;

interface FbListSubmissionsOptions {
    limit?: number;
    after?: string;
    sort?: FbSubmissionsSort;
}

export interface FbListSubmissionsMeta {
    cursor: string;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface FormBuilderGetFormOptions {
    auth?: boolean;
}

export interface FormBuilderGetFormRevisionsOptions {
    auth?: boolean;
}

export interface FormsCRUD {
    getForm(id: string, options?: FormBuilderGetFormOptions): Promise<FbForm>;
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
    getFormRevisions(id: string, options?: FormBuilderGetFormRevisionsOptions): Promise<FbForm[]>;
    getPublishedFormRevisionById(revisionId: string): Promise<FbForm>;
    getLatestPublishedFormRevision(formId: string): Promise<FbForm>;
    deleteFormRevision(id: string): Promise<boolean>;
}

export interface SubmissionsCRUD {
    getSubmissionsByIds(form: string | FbForm, submissionIds: string[]): Promise<FbSubmission[]>;
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
}

export interface BeforeInstallTopic {
    tenant: Tenant;
}

export interface AfterInstallTopic {
    tenant: Tenant;
}

export interface SystemCRUD {
    /**
     * @internal
     */
    getSystem(): Promise<System>;
    getSystemVersion(): Promise<string>;
    setSystemVersion(version: string): Promise<void>;
    installSystem(args: { domain?: string }): Promise<void>;
    upgradeSystem(version: string, data?: Record<string, any>): Promise<boolean>;
    /**
     * Events
     */
    onBeforeInstall: Topic<BeforeInstallTopic>;
    onAfterInstall: Topic<AfterInstallTopic>;
}

export interface FbSubmission {
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
    createdOn: string;
    savedOn: string;
    webinyVersion: string;
    /**
     * TODO add via upgrade
     */
    tenant: string;
}

export interface SubmissionInput {
    data: Record<string, any>;
    meta: Record<string, any>;
    reCaptchaResponseToken: string;
}

export interface SubmissionUpdateData {
    logs: Record<string, any>;
}

/**
 * @category Settings
 * @category DataModel
 */
export interface Settings {
    domain: string;
    reCaptcha: {
        enabled: boolean;
        siteKey: string;
        secretKey: string;
    };
    tenant: string;
    locale: string;
}

export interface SettingsCRUDGetParams {
    auth?: boolean;
    throwOnNotFound?: boolean;
}

export interface SettingsCRUD {
    getSettings(params?: SettingsCRUDGetParams): Promise<Settings>;
    createSettings(data: Partial<Settings>): Promise<Settings>;
    updateSettings(data: Partial<Settings>): Promise<Settings>;
    deleteSettings(): Promise<void>;
}

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

/**
 * The object representing form builder internals.
 */
export interface FormBuilder extends SystemCRUD, SettingsCRUD, FormsCRUD, SubmissionsCRUD {
    storageOperations: FormBuilderStorageOperations;
}

export interface FormBuilderContext
    extends TenancyContext,
        I18NContext,
        I18NContentContext,
        FileManagerContext,
        ElasticsearchContext {
    /**
     *
     */
    formBuilder: FormBuilder;
}
/**
 * @category System
 * @category DataModel
 */
export interface System {
    version?: string;
    tenant: string;
}
/**
 * @category StorageOperations
 * @category StorageOperationsParams
 * @category System
 */
export interface FormBuilderStorageOperationsGetSystemParams {
    tenant: string;
}
/**
 * @category StorageOperations
 * @category StorageOperationsParams
 * @category System
 */
export interface FormBuilderStorageOperationsCreateSystemParams {
    system: System;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 * @category System
 */
export interface FormBuilderStorageOperationsUpdateSystemParams {
    original: System;
    system: System;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 * @category Settings
 */
export interface FormBuilderStorageOperationsGetSettingsParams {
    tenant: string;
    locale: string;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 * @category Settings
 */
export interface FormBuilderStorageOperationsCreateSettingsParams {
    settings: Settings;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 * @category Settings
 */
export interface FormBuilderStorageOperationsUpdateSettingsParams {
    original: Settings;
    settings: Settings;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 * @category Settings
 */
export interface FormBuilderStorageOperationsDeleteSettingsParams {
    settings: Settings;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsGetFormParams {
    where: {
        id?: string;
        formId?: string;
        version?: number;
        // slug?: string;
        published?: boolean;
        latest?: boolean;
        tenant: string;
        locale: string;
    };
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsListFormsParams {
    where: {
        id?: string;
        version?: number;
        slug?: string;
        published?: boolean;
        ownedBy?: string;
        latest?: boolean;
        tenant: string;
        locale: string;
    };
    after: string | null;
    limit: number;
    sort: string[];
}
/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsListFormRevisionsParams {
    where: {
        id?: string;
        formId?: string;
        version_not?: number;
        publishedOn_not?: string | null;
        tenant: string;
        locale: string;
    };
    sort?: string[];
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsListFormsResponse {
    items: FbForm[];
    meta: {
        hasMoreItems: boolean;
        cursor: string | null;
        totalCount: number;
    };
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsCreateFormParams {
    input: Record<string, any>;
    form: FbForm;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsCreateFormFromParams {
    original: FbForm;
    latest: FbForm;
    form: FbForm;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsUpdateFormParams {
    input?: Record<string, any>;
    original: FbForm;
    form: FbForm;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsDeleteFormParams {
    form: FbForm;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsDeleteFormRevisionParams {
    /**
     * Method always receives all the revisions of given form ordered by version_DESC.
     */
    revisions: FbForm[];
    /**
     * Previous revision of the current form. Always the first lesser available version.
     */
    previous: FbForm;
    form: FbForm;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsPublishFormParams {
    original: FbForm;
    form: FbForm;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsUnpublishFormParams {
    original: FbForm;
    form: FbForm;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsGetSubmissionParams {
    where: {
        id?: string;
        formId?: string;
        tenant: string;
        locale: string;
    };
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsListSubmissionsParams {
    where: {
        id_in?: string[];
        parent: string;
        locale: string;
        tenant: string;
    };
    after?: string;
    limit?: number;
    sort?: string[];
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsCreateSubmissionParams {
    input: Record<string, any>;
    form: FbForm;
    submission: FbSubmission;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsUpdateSubmissionParams {
    input: Record<string, any>;
    form: FbForm;
    original: FbSubmission;
    submission: FbSubmission;
}
/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsDeleteSubmissionParams {
    form: FbForm;
    submission: FbSubmission;
}

/**
 * @category StorageOperations
 */
export interface FormBuilderSystemStorageOperations {
    getSystem(params: FormBuilderStorageOperationsGetSystemParams): Promise<System>;
    createSystem(params: FormBuilderStorageOperationsCreateSystemParams): Promise<System>;
    updateSystem(params: FormBuilderStorageOperationsUpdateSystemParams): Promise<System>;
}

/**
 * @category StorageOperations
 */
export interface FormBuilderSettingsStorageOperations {
    getSettings(params: FormBuilderStorageOperationsGetSettingsParams): Promise<Settings>;
    createSettings(params: FormBuilderStorageOperationsCreateSettingsParams): Promise<Settings>;
    updateSettings(params: FormBuilderStorageOperationsUpdateSettingsParams): Promise<Settings>;
    deleteSettings(params: FormBuilderStorageOperationsDeleteSettingsParams): Promise<void>;
}

/**
 * @category StorageOperations
 */
export interface FormBuilderFormStorageOperations {
    getForm(params: FormBuilderStorageOperationsGetFormParams): Promise<FbForm>;
    listForms(
        params: FormBuilderStorageOperationsListFormsParams
    ): Promise<FormBuilderStorageOperationsListFormsResponse>;
    listFormRevisions(
        params: FormBuilderStorageOperationsListFormRevisionsParams
    ): Promise<FbForm[]>;
    createForm(params: FormBuilderStorageOperationsCreateFormParams): Promise<FbForm>;
    createFormFrom(params: FormBuilderStorageOperationsCreateFormFromParams): Promise<FbForm>;
    updateForm(params: FormBuilderStorageOperationsUpdateFormParams): Promise<FbForm>;
    /**
     * Delete all form revisions + latest + published.
     */
    deleteForm(params: FormBuilderStorageOperationsDeleteFormParams): Promise<FbForm>;
    /**
     * Delete the single form revision.
     */
    deleteFormRevision(
        params: FormBuilderStorageOperationsDeleteFormRevisionParams
    ): Promise<FbForm>;
    publishForm(params: FormBuilderStorageOperationsPublishFormParams): Promise<FbForm>;
    unpublishForm(params: FormBuilderStorageOperationsUnpublishFormParams): Promise<FbForm>;
}

/**
 * @category StorageOperations
 */
export interface FormBuilderStorageOperationsListSubmissionsResponse {
    items: FbSubmission[];
    meta: FbListSubmissionsMeta;
}

/**
 * @category StorageOperations
 */
export interface FormBuilderSubmissionStorageOperations {
    getSubmission(params: FormBuilderStorageOperationsGetSubmissionParams): Promise<FbSubmission>;
    listSubmissions(
        params: FormBuilderStorageOperationsListSubmissionsParams
    ): Promise<FormBuilderStorageOperationsListSubmissionsResponse>;
    createSubmission(
        params: FormBuilderStorageOperationsCreateSubmissionParams
    ): Promise<FbSubmission>;
    updateSubmission(
        params: FormBuilderStorageOperationsUpdateSubmissionParams
    ): Promise<FbSubmission>;
    deleteSubmission(
        params: FormBuilderStorageOperationsDeleteSubmissionParams
    ): Promise<FbSubmission>;
}
/**
 * @category StorageOperations
 */
export interface FormBuilderStorageOperations
    extends FormBuilderSystemStorageOperations,
        FormBuilderSettingsStorageOperations,
        FormBuilderFormStorageOperations,
        FormBuilderSubmissionStorageOperations {
    /**
     * We can initialize what ever we require in this method.
     * Initially it was intended to attach events like afterInstall, beforeInstall, etc...
     */
    init?: (formBuilder: FormBuilder) => Promise<void>;
}

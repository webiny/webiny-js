import { Plugin } from "@webiny/plugins/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { SecurityPermission } from "@webiny/api-security/types";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import {
    CmsEntryListWhere,
    CmsEntryStatus as FormStatus,
    CmsIdentity as FormIdentity
} from "@webiny/api-headless-cms/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { Topic } from "@webiny/pubsub/types";

export { CONTENT_ENTRY_STATUS as FORM_STATUS } from "@webiny/api-headless-cms/types";

interface FbFormTriggerData {
    urls?: string[];
    [key: string]: any;
}
interface FbSubmissionData {
    [key: string]: any;
}
interface FbSubmissionMeta {
    [key: string]: any;
}

interface FbFormStep {
    title: string;
    layout: string[][];
}

interface FbFormFieldValidator {
    name: string;
    message: any;
    settings: {
        /**
         * In.
         */
        values?: string[];
        /**
         * gte, lte, max, min
         */
        value?: string;
        /**
         * Pattern.
         */
        preset?: string;
        [key: string]: any;
    };
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
    meta: FbSubmissionMeta;
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

export interface FbFormFieldOption {
    label?: string;
    value?: string;
}

export interface FbFormField {
    _id: string;
    fieldId: string;
    type: string;
    name: string;
    label: string;
    placeholderText?: string;
    helpText?: string;
    options: FbFormFieldOption[];
    validation: FbFormFieldValidator[];
    settings?: Record<string, any>;
}

export interface FbForm {
    id: string;
    tenant: string;
    locale: string;
    createdBy: FormIdentity;
    createdOn: Date | string;
    savedOn: Date | string;
    publishedOn?: Date | string;
    name: string;
    slug: string;
    version: number;
    status: FormStatus;
    fields: FbFormField[];
    steps: FbFormStep[];
    settings: Record<string, any>;
    triggers: Record<string, any> | null;
    formId: string;
    webinyVersion: string;
}

interface FormCreateInput {
    name: string;
}

interface FormUpdateInput {
    name: string;
    fields: FbFormField[];
    steps: FbFormStep[];
    settings: Record<string, any>;
    triggers: Record<string, any> | null;
}

interface FbListSubmissionsOptions {
    limit?: number;
    after?: string;
    sort?: string[];
}

export interface FbListSubmissionsMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface FormBuilderGetFormOptions {
    auth?: boolean;
}

export interface FormBuilderGetFormRevisionsOptions {
    auth?: boolean;
}

/**
 * Lifecycle Events for Forms CRUD
 */
export interface OnFormBeforeCreateTopicParams {
    form: FbForm;
}
export interface OnFormAfterCreateTopicParams {
    form: FbForm;
}
export interface OnFormRevisionBeforeCreateTopicParams {
    form: FbForm;
}
export interface OnFormRevisionAfterCreateTopicParams {
    form: FbForm;
}
export interface OnFormBeforeUpdateTopicParams {
    form: FbForm;
    original: FbForm;
}
export interface OnFormAfterUpdateTopicParams {
    form: FbForm;
    original: FbForm;
}
export interface OnFormBeforeDeleteTopicParams {
    form: FbForm;
}
export interface OnFormAfterDeleteTopicParams {
    form: FbForm;
}
export interface OnFormRevisionBeforeDeleteTopicParams {
    form: FbForm;
    previous: FbForm | null;
    revisions: FbForm[];
}
export interface OnFormRevisionAfterDeleteTopicParams {
    form: FbForm;
    previous: FbForm | null;
    revisions: FbForm[];
}
export interface OnFormBeforePublishTopicParams {
    form: FbForm;
}
export interface OnFormAfterPublishTopicParams {
    form: FbForm;
}
export interface OnFormBeforeUnpublishTopicParams {
    form: FbForm;
}
export interface OnFormAfterUnpublishTopicParams {
    form: FbForm;
}

export interface FormsCRUD {
    getForm(id: string, options?: FormBuilderGetFormOptions): Promise<FbForm>;
    listForms(): Promise<FormBuilderStorageOperationsListFormsResponse>;
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
    deleteFormRevision(id: string): Promise<boolean>;
    /**
     * Lifecycle events
     */
    onFormBeforeCreate: Topic<OnFormBeforeCreateTopicParams>;
    onFormAfterCreate: Topic<OnFormAfterCreateTopicParams>;
    onFormRevisionBeforeCreate: Topic<OnFormRevisionBeforeCreateTopicParams>;
    onFormRevisionAfterCreate: Topic<OnFormRevisionAfterCreateTopicParams>;
    onFormBeforeUpdate: Topic<OnFormBeforeUpdateTopicParams>;
    onFormAfterUpdate: Topic<OnFormAfterUpdateTopicParams>;
    onFormBeforeDelete: Topic<OnFormBeforeDeleteTopicParams>;
    onFormAfterDelete: Topic<OnFormAfterDeleteTopicParams>;
    onFormRevisionBeforeDelete: Topic<OnFormRevisionBeforeDeleteTopicParams>;
    onFormRevisionAfterDelete: Topic<OnFormRevisionAfterDeleteTopicParams>;
    onFormBeforePublish: Topic<OnFormBeforePublishTopicParams>;
    onFormAfterPublish: Topic<OnFormAfterPublishTopicParams>;
    onFormBeforeUnpublish: Topic<OnFormBeforeUnpublishTopicParams>;
    onFormAfterUnpublish: Topic<OnFormAfterUnpublishTopicParams>;
}

/**
 * Submissions CRUD Lifecycle Events
 */
export interface OnFormSubmissionBeforeCreate {
    form: FbForm;
    submission: FbSubmission;
}
export interface OnFormSubmissionAfterCreate {
    form: FbForm;
    submission: FbSubmission;
}
export interface OnFormSubmissionBeforeUpdate {
    form: FbForm;
    original: FbSubmission;
    submission: FbSubmission;
}
export interface OnFormSubmissionAfterUpdate {
    form: FbForm;
    original: FbSubmission;
    submission: FbSubmission;
}
export interface OnFormSubmissionBeforeDelete {
    form: FbForm;
    submission: FbSubmission;
}
export interface OnFormSubmissionAfterDelete {
    form: FbForm;
    submission: FbSubmission;
}
export interface OnFormSubmissionsBeforeExport {
    form: FbForm;
}
export interface OnFormSubmissionsAfterExport {
    result: {
        key: any;
        src: string;
    };
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
    /**
     * Lifecycle events
     */
    onFormSubmissionBeforeCreate: Topic<OnFormSubmissionBeforeCreate>;
    onFormSubmissionAfterCreate: Topic<OnFormSubmissionAfterCreate>;
    onFormSubmissionBeforeUpdate: Topic<OnFormSubmissionBeforeUpdate>;
    onFormSubmissionAfterUpdate: Topic<OnFormSubmissionAfterUpdate>;
    onFormSubmissionBeforeDelete: Topic<OnFormSubmissionBeforeDelete>;
    onFormSubmissionAfterDelete: Topic<OnFormSubmissionAfterDelete>;
    onFormSubmissionsBeforeExport: Topic<OnFormSubmissionsBeforeExport>;
    onFormSubmissionsAfterExport: Topic<OnFormSubmissionsAfterExport>;
}

export interface OnSystemBeforeInstallTopic {
    tenant: string;
    locale: string;
}

export interface OnSystemAfterInstallTopic {
    tenant: string;
    locale: string;
}

export interface SystemCRUD {
    /**
     * @internal
     */
    getSystem(): Promise<System | null>;
    getSystemVersion(): Promise<string | null>;
    setSystemVersion(version: string): Promise<void>;
    installSystem(args: { domain?: string }): Promise<void>;
    /**
     * Events
     */
    onSystemBeforeInstall: Topic<OnSystemBeforeInstallTopic>;
    onSystemAfterInstall: Topic<OnSystemAfterInstallTopic>;
}

export interface FbSubmission {
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
        steps: FbFormStep[];
    };
    logs: Record<string, any>[];
    createdOn: string;
    createdBy: FormIdentity;
    savedOn: string;
    webinyVersion: string;
    tenant: string;
}

/**
 * @category Settings
 * @category DataModel
 */
export interface Settings {
    domain: string;
    reCaptcha: {
        enabled: boolean | null;
        siteKey: string | null;
        secretKey: string | null;
    };
    tenant: string;
    locale: string;
}

export interface SettingsCRUDGetParams {
    auth?: boolean;
    throwOnNotFound?: boolean;
}

/**
 * Settings CRUD Lifecycle Events
 */
export interface OnSettingsBeforeCreate {
    settings: Settings;
}
export interface OnSettingsAfterCreate {
    settings: Settings;
}
export interface OnSettingsBeforeUpdate {
    original: Settings;
    settings: Settings;
}
export interface OnSettingsAfterUpdate {
    original: Settings;
    settings: Settings;
}
export interface OnSettingsBeforeDelete {
    settings: Settings;
}
export interface OnSettingsAfterDelete {
    settings: Settings;
}

export interface SettingsCRUD {
    getSettings(params?: SettingsCRUDGetParams): Promise<Settings | null>;
    createSettings(data: Partial<Settings>): Promise<Settings>;
    updateSettings(data: Partial<Settings>): Promise<Settings>;
    deleteSettings(): Promise<void>;
    /**
     * Lifecycle Events
     */
    onSettingsBeforeCreate: Topic<OnSettingsBeforeCreate>;
    onSettingsAfterCreate: Topic<OnSettingsAfterCreate>;
    onSettingsBeforeUpdate: Topic<OnSettingsBeforeUpdate>;
    onSettingsAfterUpdate: Topic<OnSettingsAfterUpdate>;
    onSettingsBeforeDelete: Topic<OnSettingsBeforeDelete>;
    onSettingsAfterDelete: Topic<OnSettingsAfterDelete>;
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
export interface FormBuilder
    extends SystemCRUD,
        SettingsCRUD,
        FormsCRUD,
        SubmissionsCRUD,
        FormStatsCRUD {
    storageOperations: FormBuilderStorageOperations;
}

export interface FormBuilderContext extends TenancyContext, I18NContext, FileManagerContext {
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
        published?: boolean;
        latest?: boolean;
        tenant: string;
        locale: string;
    };
}

export interface FormBuilderStorageOperationsListFormsWhereParams extends CmsEntryListWhere {
    tenant: string;
    locale: string;
}
/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsListFormsParams {
    where: FormBuilderStorageOperationsListFormsWhereParams;
    after: string | null;
    limit: number;
    sort: string[];
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsListFormRevisionsParamsWhere {
    formId: string;
    version_not?: number;
    publishedOn_not?: string | null;
    tenant: string;
    locale: string;
}
/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsListFormRevisionsParams {
    where: FormBuilderStorageOperationsListFormRevisionsParamsWhere;
    sort?: string[];
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */

export type FormBuilderStorageOperationsListFormsResponse = [
    FbForm[],
    {
        hasMoreItems: boolean;
        cursor: string | null;
        totalCount: number;
    }
];

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsCreateFormParams {
    form: FbForm;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsCreateFormFromParams {
    form: FbForm;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsUpdateFormParams {
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
    form: FbForm;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsPublishFormParams {
    form: FbForm;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsUnpublishFormParams {
    form: FbForm;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsGetSubmissionParams {
    where: {
        id: string;
        formId: string;
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
        formId: string;
        locale: string;
        tenant: string;
    };
    after?: string | null;
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
    getSystem(params: FormBuilderStorageOperationsGetSystemParams): Promise<System | null>;
    createSystem(params: FormBuilderStorageOperationsCreateSystemParams): Promise<System>;
    updateSystem(params: FormBuilderStorageOperationsUpdateSystemParams): Promise<System>;
}

/**
 * @category StorageOperations
 */
export interface FormBuilderSettingsStorageOperations {
    getSettings(params: FormBuilderStorageOperationsGetSettingsParams): Promise<Settings | null>;
    createSettings(params: FormBuilderStorageOperationsCreateSettingsParams): Promise<Settings>;
    updateSettings(params: FormBuilderStorageOperationsUpdateSettingsParams): Promise<Settings>;
    deleteSettings(params: FormBuilderStorageOperationsDeleteSettingsParams): Promise<void>;
}

/**
 * @category StorageOperations
 */
export interface FormBuilderFormStorageOperations {
    getForm(params: FormBuilderStorageOperationsGetFormParams): Promise<FbForm | null>;
    createForm(params: FormBuilderStorageOperationsCreateFormParams): Promise<FbForm>;
    createFormFrom(params: FormBuilderStorageOperationsCreateFormFromParams): Promise<FbForm>;
    updateForm(params: FormBuilderStorageOperationsUpdateFormParams): Promise<FbForm>;
    /**
     * Delete all form revisions + latest + published.
     */
    deleteForm(params: FormBuilderStorageOperationsDeleteFormParams): Promise<void>;
    /**
     * Delete the single form revision.
     */
    deleteFormRevision(params: FormBuilderStorageOperationsDeleteFormRevisionParams): Promise<void>;
    listForms(
        params: FormBuilderStorageOperationsListFormsParams
    ): Promise<FormBuilderStorageOperationsListFormsResponse>;
    listFormRevisions(
        params: FormBuilderStorageOperationsListFormRevisionsParams
    ): Promise<FbForm[]>;
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
    listSubmissions(
        params: FormBuilderStorageOperationsListSubmissionsParams
    ): Promise<FormBuilderStorageOperationsListSubmissionsResponse>;
    createSubmission(
        params: FormBuilderStorageOperationsCreateSubmissionParams
    ): Promise<FbSubmission>;
    updateSubmission(
        params: FormBuilderStorageOperationsUpdateSubmissionParams
    ): Promise<FbSubmission>;
    deleteSubmission(params: FormBuilderStorageOperationsDeleteSubmissionParams): Promise<void>;
}
/**
 * @category StorageOperations
 */
export interface FormBuilderStorageOperations
    extends FormBuilderSystemStorageOperations,
        FormBuilderSettingsStorageOperations {
    forms: FormBuilderFormStorageOperations;
    formStats: FormBuilderFormStatsStorageOperations;
    submissions: FormBuilderSubmissionStorageOperations;
}

export interface FbFormStats {
    id: string;
    formId: string;
    formVersion: number;
    views: number;
    submissions: number;
    tenant: string;
    locale: string;
}

/**
 * FormStats CRUD Lifecycle Events
 */
export interface OnFormStatsBeforeCreate {
    formStats: FbFormStats;
}
export interface OnFormStatsAfterCreate {
    formStats: FbFormStats;
}
export interface OnFormStatsBeforeUpdate {
    original: FbFormStats;
    formStats: FbFormStats;
}
export interface OnFormStatsAfterUpdate {
    original: FbFormStats;
    formStats: FbFormStats;
}
export interface OnFormStatsBeforeDelete {
    ids: string[];
}
export interface OnFormStatsAfterDelete {
    ids: string[];
}

export interface FormStatsCRUD {
    getFormStats(formRevisionId: string): Promise<FbFormStats | null>;
    getFormOverallStats(id: string): Promise<Omit<FbFormStats, "id" | "formVersion"> | null>;
    createFormStats(form: FbForm): Promise<FbFormStats>;
    updateFormStats(
        formRevisionId: string,
        input: { views?: number; submissions?: number }
    ): Promise<FbFormStats>;
    deleteFormStats(formId: string): Promise<void>;
    /**
     * Lifecycle events
     */
    onFormStatsBeforeCreate: Topic<OnFormStatsBeforeCreate>;
    onFormStatsAfterCreate: Topic<OnFormStatsAfterCreate>;
    onFormStatsBeforeUpdate: Topic<OnFormStatsBeforeUpdate>;
    onFormStatsAfterUpdate: Topic<OnFormStatsAfterUpdate>;
    onFormStatsBeforeDelete: Topic<OnFormStatsBeforeDelete>;
    onFormStatsAfterDelete: Topic<OnFormStatsAfterDelete>;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsGetFormStatsParams {
    where: { id: string; tenant: string; locale: string };
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsListFormStatsParams {
    where: { formId: string; tenant: string; locale: string };
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsCreateFormStatsParams {
    formStats: FbFormStats;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsUpdateFormStatsParams {
    formStats: FbFormStats;
}

/**
 * @category StorageOperations
 * @category StorageOperationsParams
 */
export interface FormBuilderStorageOperationsDeleteFormStatsParams {
    ids: string[];
    tenant: string;
    locale: string;
}

/**
 * @category StorageOperations
 */
export interface FormBuilderFormStatsStorageOperations {
    getFormStats(
        params: FormBuilderStorageOperationsGetFormStatsParams
    ): Promise<FbFormStats | null>;
    listFormStats(
        params: FormBuilderStorageOperationsListFormStatsParams
    ): Promise<FbFormStats[] | null>;
    createFormStats(
        params: FormBuilderStorageOperationsCreateFormStatsParams
    ): Promise<FbFormStats>;
    updateFormStats(
        params: FormBuilderStorageOperationsUpdateFormStatsParams
    ): Promise<FbFormStats>;
    deleteFormStats(params: FormBuilderStorageOperationsDeleteFormStatsParams): Promise<void>;
}

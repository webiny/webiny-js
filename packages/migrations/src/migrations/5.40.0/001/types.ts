// General
interface LastEvaluatedKey {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
}

export interface MigrationCheckpoint {
    lastEvaluatedKey?: LastEvaluatedKey | boolean;
}

export interface Tenant {
    data: {
        id: string;
        name: string;
    };
}

export interface I18NLocale {
    code: string;
}

export interface Identity {
    id: string;
    displayName: string | null;
    type: string;
}

export enum Status {
    PUBLISHED = "published",
    UNPUBLISHED = "unpublished",
    DRAFT = "draft"
}

// Forms - 5.38.0
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
    placeholderText: string | null;
    helpText: string | null;
    options: FbFormFieldOption[];
    validation: FbFormFieldValidator[];
    settings: JSON;
}

export type FbFormLayout = Array<Array<string>>;

interface FbFormStep {
    title: string;
    layout: FbFormLayout;
}

interface FbFormFieldValidatorSettings {
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
}

interface FbFormFieldValidator {
    name: string;
    message: any;
    settings: FbFormFieldValidatorSettings;
}

export interface FbFormStats {
    submissions: number;
    views: number;
}

export interface FbFormSettings {
    fullWidthSubmitButton: boolean | null;
    successMessage: JSON[] | null;
    submitButtonLabel: string | null;
    layout: {
        renderer: string | null;
    } | null;
    reCaptcha: {
        enabled: boolean | null;
        errorMessage: string | null;
    };
    termsOfServiceMessage: {
        enabled: boolean | null;
        errorMessage: string | null;
        message: JSON[] | null;
    } | null;
}

export interface FbForm {
    id: string;
    tenant: string;
    locale: string;
    createdBy: Identity;
    ownedBy: Identity;
    savedOn: string;
    createdOn: string;
    name: string;
    slug: string;
    version: number;
    locked: boolean;
    published: boolean;
    publishedOn: string | null;
    status: Status;
    fields: FbFormField[];
    steps: FbFormStep[];
    stats: FbFormStats;
    settings: FbFormSettings;
    triggers: Record<string, any> | null;
    formId: string;
    webinyVersion: string;
}

// CMS Entries / Forms - 5.40.0

export interface CmsEntryValues {
    [key: string]: any;
}

export interface MetaFields {
    /**
     * Entry-level meta fields. 👇
     */
    createdOn: string;
    savedOn: string;
    modifiedOn: string | null;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    createdBy: Identity;
    savedBy: Identity;
    modifiedBy: Identity | null;
    firstPublishedBy: Identity | null;
    lastPublishedBy: Identity | null;
    /**
     * Revision-level meta fields. 👇
     */
    revisionCreatedOn: string;
    revisionSavedOn: string;
    revisionModifiedOn: string | null;
    revisionFirstPublishedOn: string | null;
    revisionLastPublishedOn: string | null;
    revisionCreatedBy: Identity;
    revisionSavedBy: Identity;
    revisionModifiedBy: Identity | null;
    revisionFirstPublishedBy: Identity | null;
    revisionLastPublishedBy: Identity | null;
}

export interface CmsEntry<T = CmsEntryValues> {
    webinyVersion: string;
    tenant: string;
    entryId: string;
    id: string;
    modelId: string;
    locale: string;
    location: {
        folderId: string;
    };
    version: number;
    locked: boolean;
    status: Status;
    values: T;
    meta?: {
        [key: string]: any;
    };
}

export interface CmsEntryWithMeta<T = CmsEntryValues> extends CmsEntry<T>, MetaFields {}

export interface FormEntryValues {
    "json@triggers": Record<string, any> | null;
    "object@fields": Array<{
        "json@settings": JSON | null;
        "object@options": Array<{
            "text@label"?: string;
            "text@value"?: string;
        }> | null;
        "object@validation": {
            "json@settings": FbFormFieldValidatorSettings;
            "text@message": any;
            "text@name": string;
        }[];
        "text@fieldId": string;
        "text@helpText": string | null;
        "text@label": string;
        "text@name": string;
        "text@placeholderText": string | null;
        "text@type": string;
        "text@_id": string;
    }>;
    "object@settings": {
        "boolean@fullWidthSubmitButton": boolean | null;
        "json@successMessage": JSON[] | null;
        "text@submitButtonLabel": string | null;
        "object@layout": {
            "text@renderer": string | null;
        } | null;
        "object@reCaptcha": {
            "boolean@enabled": boolean | null;
            "text@errorMessage": string | null;
        };
        "object@termsOfServiceMessage"?: {
            "boolean@enabled": boolean | null;
            "json@message": JSON[] | null;
            "text@errorMessage": string | null;
        };
    };
    "object@steps": Array<{
        "json@layout": FbFormLayout;
        "text@title": string;
    }>;
    "text@formId": string;
    "text@name": string;
    "text@slug": string;
}

export interface FormStatsValues {
    "number@formVersion": number;
    "number@submissions": number;
    "number@views": number;
    "text@formId": string;
}

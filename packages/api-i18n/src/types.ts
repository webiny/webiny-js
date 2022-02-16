import { Plugin } from "@webiny/plugins/types";
import { ClientContext } from "@webiny/handler-client/types";
import { Context } from "@webiny/handler/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { Topic } from "@webiny/pubsub/types";
import { SecurityContext } from "@webiny/api-security/types";

export interface I18NLocale {
    code: string;
    default: boolean;
    createdOn: string;
    createdBy: {
        id: string;
        displayName: string;
        type: string;
    };
    tenant: string;
    webinyVersion: string;
}

export interface I18NContextObject {
    __i18n: {
        acceptLanguage: string | null;
        defaultLocale: I18NLocale | null;
        locale: Record<string, I18NLocale>;
        locales: I18NLocale[];
    };
    defaultLocale?: string;
    acceptLanguage?: string;
    getCurrentLocale: (localeContext?: string) => I18NLocale;
    getCurrentLocales: () => { context: string; locale: string }[];
    getDefaultLocale: () => I18NLocale;
    getLocales: () => I18NLocale[];
    getLocale: (code: string) => I18NLocale | null;
    locales: LocalesCRUD;
    system: SystemCRUD;
}

export interface SystemInstallParams {
    code: string;
}

/**
 * Definition for the system part crud of the i18n.
 */
export interface SystemCRUD {
    /**
     * Get the current version of the i18n.
     */
    getSystemVersion(): Promise<string | null>;
    /**
     * Set the current version of the i18n.
     */
    setSystemVersion(version: string): Promise<void>;
    /**
     * Run the install process for the i18n.
     */
    installSystem(params: SystemInstallParams): Promise<void>;
}

export interface I18NContext extends Context, ClientContext, TenancyContext, SecurityContext {
    i18n: I18NContextObject;
}

export interface ContextI18NGetLocales extends Plugin {
    name: "context-i18n-get-locales";
    type: "context-i18n-get-locales";
    resolve(params: { context: I18NContext }): Promise<any[]>;
}

export interface I18NSystem {
    version: string;
    tenant: string;
}

/**
 * Data for the new locale.
 */
export interface LocalesCRUDCreate {
    code: string;
    default?: boolean;
}

/**
 * Data to be updated in the given locale.
 */
export interface LocalesCRUDUpdate {
    default: boolean;
}

export interface LocalesCRUDListParams {
    where?: {
        code?: string;
        default?: boolean;
        [key: string]: any;
    };
    sort?: string[];
    limit?: number;
    after?: string;
}

export interface OnBeforeCreateLocaleTopicParams {
    context: I18NContext;
    locale: I18NLocale;
}
export interface OnAfterCreateLocaleTopicParams {
    context: I18NContext;
    locale: I18NLocale;
}
export interface OnBeforeUpdateLocaleTopicParams {
    context: I18NContext;
    original: I18NLocale;
    locale: I18NLocale;
}
export interface OnAfterUpdateLocaleTopicParams {
    context: I18NContext;
    original: I18NLocale;
    locale: I18NLocale;
}
export interface OnBeforeDeleteLocaleTopicParams {
    context: I18NContext;
    locale: I18NLocale;
}
export interface OnAfterDeleteLocaleTopicParams {
    context: I18NContext;
    locale: I18NLocale;
}
/**
 * Definition for the locales part crud of the i18n.
 */
export interface LocalesCRUD {
    /**
     * Lifecycle events.
     */
    onBeforeCreate: Topic<OnBeforeCreateLocaleTopicParams>;
    onAfterCreate: Topic<OnAfterCreateLocaleTopicParams>;
    onBeforeUpdate: Topic<OnBeforeUpdateLocaleTopicParams>;
    onAfterUpdate: Topic<OnAfterUpdateLocaleTopicParams>;
    onBeforeDelete: Topic<OnBeforeDeleteLocaleTopicParams>;
    onAfterDelete: Topic<OnAfterDeleteLocaleTopicParams>;
    /**
     * Get the default locale.
     */
    getDefaultLocale: () => Promise<I18NLocale>;
    /**
     * Get the locale by given code.
     */
    getLocale: (code: string) => Promise<I18NLocale>;
    /**
     * List all locales in the storage.
     */
    listLocales: (
        params?: LocalesCRUDListParams
    ) => Promise<I18NLocalesStorageOperationsListResponse>;
    /**
     * Create a new locale.
     */
    createLocale: (data: LocalesCRUDCreate) => Promise<I18NLocale>;
    /**
     * Update the locale with new data.
     */
    updateLocale: (code: string, data: LocalesCRUDUpdate) => Promise<I18NLocale>;
    /**
     * Delete the given locale by code.
     */
    deleteLocale: (code: string) => Promise<I18NLocale>;
}

export interface I18NLocalesStorageOperationsListParams {
    where?: {
        code?: string;
        default?: boolean;
        createdBy?: string;
        createdOn?: string;
        createdOn_not?: string;
        createdOn_not_in?: string[];
        createdOn_lt?: string;
        createdOn_lte?: string;
        createdOn_gt?: string;
        createdOn_gte?: string;
    };
    limit?: number;
    after?: string;
    sort?: string[];
}
interface I18NLocalesStorageOperationsListResponseMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string;
}
export type I18NLocalesStorageOperationsListResponse = [
    I18NLocale[],
    I18NLocalesStorageOperationsListResponseMeta
];

export interface I18NLocalesStorageOperationsCreateParams {
    locale: I18NLocale;
}
export interface I18NLocalesStorageOperationsUpdateParams {
    original: I18NLocale;
    locale: I18NLocale;
}
export interface I18NLocalesStorageOperationsUpdateDefaultParams {
    /**
     * The current default locale, possibly null if its the first insert into the storage..
     */
    previous?: I18NLocale | null;
    /**
     * Locale to set as the default one.
     */
    locale: I18NLocale;
}
export interface I18NLocalesStorageOperationsDeleteParams {
    locale: I18NLocale;
}

export interface I18NLocalesStorageOperations {
    getDefault: () => Promise<I18NLocale>;
    get: (code: string) => Promise<I18NLocale | null>;
    list: (
        params?: I18NLocalesStorageOperationsListParams
    ) => Promise<I18NLocalesStorageOperationsListResponse>;
    create: (params: I18NLocalesStorageOperationsCreateParams) => Promise<I18NLocale>;
    update: (params: I18NLocalesStorageOperationsUpdateParams) => Promise<I18NLocale>;
    updateDefault: (params: I18NLocalesStorageOperationsUpdateDefaultParams) => Promise<I18NLocale>;
    delete: (params: I18NLocalesStorageOperationsDeleteParams) => Promise<void>;
}

export interface I18NSystemStorageOperationsCreate {
    system: I18NSystem;
}

export interface I18NSystemStorageOperationsUpdate {
    original: I18NSystem;
    system: I18NSystem;
}

export interface I18NSystemStorageOperations {
    get: () => Promise<I18NSystem>;
    create: (input: I18NSystemStorageOperationsCreate) => Promise<I18NSystem>;
    update: (input: I18NSystemStorageOperationsUpdate) => Promise<I18NSystem>;
}

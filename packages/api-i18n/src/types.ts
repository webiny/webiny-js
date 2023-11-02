import { Plugin } from "@webiny/plugins/types";
import { ClientContext } from "@webiny/handler-client/types";
import { Context } from "@webiny/api/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { Topic } from "@webiny/pubsub/types";
import { SecurityContext } from "@webiny/api-security/types";

export type LocaleKeys = "default" | "content";
export interface I18NLocale {
    code: string;
    default: boolean;
}

interface I18NLocaleDataCreatedBy {
    id: string;
    displayName: string | null;
    type: string;
}

export interface I18NLocaleData extends I18NLocale {
    createdOn: string;
    createdBy: I18NLocaleDataCreatedBy;
    tenant: string;
    webinyVersion: string;
}

export interface I18NContextObject {
    defaultLocale?: string | null;
    acceptLanguage?: string | null;
    getContentLocale(): I18NLocale | undefined;
    getCurrentLocale: (localeContext: LocaleKeys) => I18NLocale | undefined;
    setCurrentLocale: (localeContext: LocaleKeys, locale: I18NLocale) => void;
    getCurrentLocales: () => { context: string; locale: string | null }[];
    getDefaultLocale: () => I18NLocale | undefined;
    setContentLocale: (locale: I18NLocale) => void;
    getLocales: () => I18NLocale[];
    getLocale: (code: string) => I18NLocale | undefined;
    reloadLocales: () => Promise<void>;
    locales: LocalesCRUD;
    system: SystemCRUD;
    hasI18NContentPermission: () => Promise<boolean>;
    checkI18NContentPermission: () => Promise<void>;
}

export interface SystemInstallParams {
    code: string;
}

/**
 * Definition for the system part crud of the i18n.
 */
export interface SystemCRUD {
    storageOperations: I18NSystemStorageOperations;
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
    /**
     * Lifecycle events - deprecated in 5.34.0 - will be removed in 5.36.0
     */
    /**
     * @deprecated
     */
    onBeforeInstall: Topic<OnSystemBeforeInstallTopicParams>;
    /**
     * @deprecated
     */
    onAfterInstall: Topic<OnSystemAfterInstallTopicParams>;
    /**
     * Introduced in 5.34.0
     */
    onSystemBeforeInstall: Topic<OnSystemBeforeInstallTopicParams>;
    onSystemAfterInstall: Topic<OnSystemAfterInstallTopicParams>;
}

export interface I18NContext extends Context, ClientContext, TenancyContext, SecurityContext {
    i18n: I18NContextObject;
}

export interface ContextI18NGetLocales extends Plugin {
    name: "context-i18n-get-locales";
    type: "context-i18n-get-locales";
    resolve(params: { context: I18NContext }): Promise<I18NLocale[]>;
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

export interface OnSystemBeforeInstallTopicParams {
    code: string;
}
export interface OnSystemAfterInstallTopicParams {
    code: string;
}

export interface OnLocaleBeforeCreateTopicParams {
    context: I18NContext;
    locale: I18NLocaleData;
    tenant: string;
}
export interface OnLocaleAfterCreateTopicParams {
    context: I18NContext;
    locale: I18NLocaleData;
    tenant: string;
}
export interface OnLocaleBeforeUpdateTopicParams {
    context: I18NContext;
    original: I18NLocaleData;
    locale: I18NLocaleData;
    tenant: string;
}
export interface OnLocaleAfterUpdateTopicParams {
    context: I18NContext;
    original: I18NLocaleData;
    locale: I18NLocaleData;
    tenant: string;
}
export interface OnLocaleBeforeDeleteTopicParams {
    context: I18NContext;
    locale: I18NLocaleData;
    tenant: string;
}
export interface OnLocaleAfterDeleteTopicParams {
    context: I18NContext;
    locale: I18NLocaleData;
    tenant: string;
}
/**
 * Definition for the locales part crud of the i18n.
 */
export interface LocalesCRUD {
    storageOperations: I18NLocalesStorageOperations;
    /**
     * Lifecycle events - deprecated in 5.34.0 - will be removed in 5.36.0
     */
    /**
     * @deprecated
     */
    onBeforeCreate: Topic<OnLocaleBeforeCreateTopicParams>;
    /**
     * @deprecated
     */
    onAfterCreate: Topic<OnLocaleAfterCreateTopicParams>;
    /**
     * @deprecated
     */
    onBeforeUpdate: Topic<OnLocaleBeforeUpdateTopicParams>;
    /**
     * @deprecated
     */
    onAfterUpdate: Topic<OnLocaleAfterUpdateTopicParams>;
    /**
     * @deprecated
     */
    onBeforeDelete: Topic<OnLocaleBeforeDeleteTopicParams>;
    /**
     * @deprecated
     */
    onAfterDelete: Topic<OnLocaleAfterDeleteTopicParams>;
    /**
     * Introduced in 5.34.0
     */
    onLocaleBeforeCreate: Topic<OnLocaleBeforeCreateTopicParams>;
    onLocaleAfterCreate: Topic<OnLocaleAfterCreateTopicParams>;
    onLocaleBeforeUpdate: Topic<OnLocaleBeforeUpdateTopicParams>;
    onLocaleAfterUpdate: Topic<OnLocaleAfterUpdateTopicParams>;
    onLocaleBeforeDelete: Topic<OnLocaleBeforeDeleteTopicParams>;
    onLocaleAfterDelete: Topic<OnLocaleAfterDeleteTopicParams>;
    /**
     * Get the default locale.
     */
    getDefaultLocale: () => Promise<I18NLocaleData>;
    /**
     * Get the locale by given code.
     */
    getLocale: (code: string) => Promise<I18NLocaleData>;
    /**
     * List all locales in the storage.
     */
    listLocales: (
        params?: LocalesCRUDListParams
    ) => Promise<I18NLocalesStorageOperationsListResponse>;
    /**
     * Create a new locale.
     */
    createLocale: (data: LocalesCRUDCreate) => Promise<I18NLocaleData>;
    /**
     * Update the locale with new data.
     */
    updateLocale: (code: string, data: LocalesCRUDUpdate) => Promise<I18NLocaleData>;
    /**
     * Delete the given locale by code.
     */
    deleteLocale: (code: string) => Promise<I18NLocaleData>;
}

export interface I18NLocalesStorageOperationsGetDefaultParams {
    tenant: string;
}

export interface I18NLocalesStorageOperationsGetParams {
    code: string;
    tenant: string;
}

export interface I18NLocalesStorageOperationsListParams {
    where: {
        tenant: string;
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
    limit: number;
    after?: string;
    sort?: string[];
}
interface I18NLocalesStorageOperationsListResponseMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}
export type I18NLocalesStorageOperationsListResponse = [
    I18NLocaleData[],
    I18NLocalesStorageOperationsListResponseMeta
];

export interface I18NLocalesStorageOperationsCreateParams {
    locale: I18NLocaleData;
}
export interface I18NLocalesStorageOperationsUpdateParams {
    original: I18NLocaleData;
    locale: I18NLocaleData;
}
export interface I18NLocalesStorageOperationsUpdateDefaultParams {
    /**
     * The current default locale, possibly null if its the first insert into the storage..
     */
    previous?: I18NLocaleData | null;
    /**
     * Locale to set as the default one.
     */
    locale: I18NLocaleData;
}
export interface I18NLocalesStorageOperationsDeleteParams {
    locale: I18NLocaleData;
}

export interface I18NLocalesStorageOperations {
    getDefault: (
        params: I18NLocalesStorageOperationsGetDefaultParams
    ) => Promise<I18NLocaleData | null>;
    get: (params: I18NLocalesStorageOperationsGetParams) => Promise<I18NLocaleData | null>;
    list: (
        params: I18NLocalesStorageOperationsListParams
    ) => Promise<I18NLocalesStorageOperationsListResponse>;
    create: (params: I18NLocalesStorageOperationsCreateParams) => Promise<I18NLocaleData>;
    update: (params: I18NLocalesStorageOperationsUpdateParams) => Promise<I18NLocaleData>;
    updateDefault: (
        params: I18NLocalesStorageOperationsUpdateDefaultParams
    ) => Promise<I18NLocaleData>;
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

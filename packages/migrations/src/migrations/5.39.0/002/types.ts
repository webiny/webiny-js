import { CmsIdentity } from "@webiny/api-headless-cms/types";

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

export interface CmsEntryValues {
    [key: string]: any;
}

export type CmsEntryStatus = "published" | "unpublished" | "draft";

export interface CmsEntry<T = CmsEntryValues> {
    webinyVersion: string;
    tenant: string;
    entryId: string;
    id: string;
    modelId: string;
    locale: string;
    version: number;
    locked: boolean;
    status: CmsEntryStatus;
    values: T;
    meta?: {
        [key: string]: any;
    };
    location?: {
        folderId?: string | null;
    };

    /**
     * Revision-level meta fields. 👇
     */

    /**
     * An ISO 8601 date/time string.
     */
    revisionCreatedOn: string;
    /**
     * An ISO 8601 date/time string.
     */
    revisionSavedOn: string;
    /**
     * An ISO 8601 date/time string.
     */
    revisionModifiedOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    revisionFirstPublishedOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    revisionLastPublishedOn: string | null;

    /**
     * Identity that last ionCreated the entry.
     */
    revisionCreatedBy: CmsIdentity;
    /**
     * Identity that last ionSaved the entry.
     */
    revisionSavedBy: CmsIdentity;
    /**
     * Identity that last ionModified the entry.
     */
    revisionModifiedBy: CmsIdentity | null;
    /**
     * Identity that first published the entry.
     */
    revisionFirstPublishedBy: CmsIdentity | null;
    /**
     * Identity that last published the entry.
     */
    revisionLastPublishedBy: CmsIdentity | null;

    /**
     * Entry-level meta fields. 👇
     */

    /**
     * An ISO 8601 date/time string.
     */
    createdOn: string;
    /**
     * An ISO 8601 date/time string.
     */
    savedOn: string;
    /**
     * An ISO 8601 date/time string.
     */
    modifiedOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    firstPublishedOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    lastPublishedOn: string | null;

    /**
     * Identity that last created the entry.
     */
    createdBy: CmsIdentity;
    /**
     * Identity that last saved the entry.
     */
    savedBy: CmsIdentity;
    /**
     * Identity that last modified the entry.
     */
    modifiedBy: CmsIdentity | null;
    /**
     * Identity that first published the entry.
     */
    firstPublishedBy: CmsIdentity | null;
    /**
     * Identity that last published the entry.
     */
    lastPublishedBy: CmsIdentity | null;

    // Deprecated fields.
    ownedBy: CmsIdentity;
    publishedOn?: string | null;
}

export interface ListLocalesParams {
    tenant: Tenant;
}

export interface ListModelsParams {
    tenant: Tenant;
    locale: I18NLocale;
}

export interface CmsModel {
    modelId: string;
    name: string;
}

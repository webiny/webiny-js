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
     * 🚫 Deprecated meta fields below.
     * Will be fully removed in one of the next releases.
     */

    /**
     * @deprecated Use `revisionCreatedBy` or `entryCreatedBy` instead.
     * CreatedBy object reference.
     */
    createdBy: CmsIdentity;
    /**
     * @deprecated Use `entryCreatedBy` instead.
     * OwnedBy object reference. Can be different from CreatedBy.
     */
    ownedBy: CmsIdentity;
    /**
     * @deprecated Use `revisionModifiedBy` or `entryModifiedBy` instead.
     * ModifiedBy object reference. Last person who modified the entry.
     */
    modifiedBy?: CmsIdentity | null;
    /**
     * @deprecated Use `revisionCreatedOn` or `entryCreatedOn` instead.
     * A string of Date.toISOString() type.
     * Populated on creation.
     */
    createdOn: string;
    /**
     * @deprecated Use `revisionSavedOn` or `entrySavedOn` instead.
     * A string of Date.toISOString() type.
     * Populated every time entry is saved.
     */
    savedOn: string;
    /**
     * @deprecated Use `entryLastPublishedOn` or `entryFirstPublishedOn` instead.
     * A string of Date.toISOString() type - if published.
     * Populated when entry is published.
     */
    publishedOn?: string | null;

    /**
     * 🆕 New meta fields below.
     * Users are encouraged to use these instead of the deprecated ones above.
     */

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
    entryCreatedOn: string;
    /**
     * An ISO 8601 date/time string.
     */
    entrySavedOn: string;
    /**
     * An ISO 8601 date/time string.
     */
    entryModifiedOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    entryFirstPublishedOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    entryLastPublishedOn: string | null;

    /**
     * Identity that last created the entry.
     */
    entryCreatedBy: CmsIdentity;
    /**
     * Identity that last saved the entry.
     */
    entrySavedBy: CmsIdentity;
    /**
     * Identity that last modified the entry.
     */
    entryModifiedBy: CmsIdentity | null;
    /**
     * Identity that first published the entry.
     */
    entryFirstPublishedBy: CmsIdentity | null;
    /**
     * Identity that last published the entry.
     */
    entryLastPublishedBy: CmsIdentity | null;
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

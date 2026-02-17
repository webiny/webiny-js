/**
 * Entry values type.
 */
export interface CmsEntryValues {
    [key: string]: any;
}

/**
 * Entry status type.
 */
export type CmsEntryStatus = "published" | "unpublished" | "draft";

/**
 * CMS identity.
 */
export interface CmsIdentity {
    /**
     * ID of the user.
     */
    id: string;
    /**
     * Full name of the user.
     */
    displayName: string;
    /**
     * Type of the user (admin, user).
     */
    type: string;
}

/**
 * Entry state.
 */
export interface IEntryState {
    state: string;
    workflowId: string;
    stepId: string;
    stepName: string;
}

/**
 * CMS entry data returned from queries.
 */
export interface CmsEntryData<TValues extends CmsEntryValues = CmsEntryValues> {
    id?: string;
    entryId?: string;
    status?: CmsEntryStatus;

    /**
     * Entry-level meta fields.
     */
    createdOn?: Date | string;
    modifiedOn?: Date | string | null;
    savedOn?: Date | string;
    deletedOn?: Date | string | null;
    restoredOn?: Date | string | null;
    createdBy?: CmsIdentity;
    modifiedBy?: CmsIdentity;
    savedBy?: CmsIdentity;
    deletedBy?: CmsIdentity | null;
    restoredBy?: CmsIdentity | null;
    firstPublishedOn?: Date | string;
    lastPublishedOn?: Date | string;
    firstPublishedBy?: CmsIdentity;
    lastPublishedBy?: CmsIdentity;

    /**
     * Revision-level meta fields.
     */
    revisionCreatedOn?: Date | string;
    revisionModifiedOn?: Date | string | null;
    revisionSavedOn?: Date | string;
    revisionDeletedOn?: Date | string | null;
    revisionRestoredOn?: Date | string | null;
    revisionCreatedBy?: CmsIdentity;
    revisionModifiedBy?: CmsIdentity | null;
    revisionSavedBy?: CmsIdentity;
    revisionDeletedBy?: CmsIdentity | null;
    revisionRestoredBy?: CmsIdentity | null;
    revisionFirstPublishedOn?: Date | string;
    revisionLastPublishedOn?: Date | string;
    revisionFirstPublishedBy?: CmsIdentity;
    revisionLastPublishedBy?: CmsIdentity;

    location?: {
        folderId?: string | null;
    };

    values?: TValues;
}

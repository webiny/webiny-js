export interface WbIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface WbLocation {
    folderId: string;
}

export type WbPageStatus = "draft" | "published" | "unpublished";

/**
 * A Website Builder page revision. Only the fields named in a method's `fields` param are
 * returned. `properties`, `metadata`, `bindings`, `elements` and `extensions` are JSON.
 */
export interface WbPage<TProperties = Record<string, any>, TExtensions = Record<string, any>> {
    id: string;
    entryId: string;
    location: WbLocation;
    status: WbPageStatus | string;
    version: number;
    locked: boolean;
    createdOn: string;
    modifiedOn: string | null;
    savedOn: string;
    deletedOn: string | null;
    restoredOn: string | null;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    createdBy: WbIdentity;
    modifiedBy: WbIdentity | null;
    savedBy: WbIdentity;
    deletedBy: WbIdentity | null;
    restoredBy: WbIdentity | null;
    firstPublishedBy: WbIdentity | null;
    lastPublishedBy: WbIdentity | null;
    live: { version: number } | null;
    revisionDescription: string | null;
    properties: TProperties;
    metadata: Record<string, any>;
    bindings: Record<string, any>;
    elements: Record<string, any>;
    extensions: TExtensions;
    languagePaths: Record<string, any> | null;
}

export interface WbPageRevision {
    id: string;
    entryId: string;
    version: number;
    title: string;
    status: string;
    locked: boolean;
    savedOn: string;
    createdOn: string;
    createdBy: WbIdentity | null;
    revisionDescription: string | null;
}

export interface WbListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface WbGlobalComponent {
    name: string;
    /** Code of the language the global is stored in; "default" when it has none. */
    language: string;
    elements: Record<string, any>;
    bindings: Record<string, any>;
}

/** Sort values accepted by `listPages`. */
export type WbPageListSorter =
    | "id_ASC"
    | "id_DESC"
    | "createdOn_ASC"
    | "createdOn_DESC"
    | "modifiedOn_ASC"
    | "modifiedOn_DESC"
    | "savedOn_ASC"
    | "savedOn_DESC"
    | "deletedOn_ASC"
    | "deletedOn_DESC"
    | "restoredOn_ASC"
    | "restoredOn_DESC"
    | "firstPublishedOn_ASC"
    | "firstPublishedOn_DESC"
    | "lastPublishedOn_ASC"
    | "lastPublishedOn_DESC";

/** The `where` of `listPages` (`WbPagesListWhereInput`): any of its filters, e.g. `location.folderId`, `latest`, `status`. */
export type WbPagesListWhere = Record<string, unknown>;

export interface WbPageInput {
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface WbPageCreateInput extends WbPageInput {
    location?: { folderId?: string };
}

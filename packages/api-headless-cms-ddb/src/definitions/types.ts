import type { IEntity, IStandardEntityAttributes } from "@webiny/db-dynamodb";
import type { GenericRecord } from "@webiny/api/types.js";
import type {
    CmsEntryStatus,
    CmsGroup,
    CmsIdentity,
    CmsModel,
    ICmsEntryLocation,
    IEntryState
} from "@webiny/api-headless-cms/types/index.js";

export interface IEntryEntityAttirbutesData {
    id: string;
    entryId: string;
    modelId: string;

    tenant: string;
    /**
     * Revision-level meta fields. 👇
     */
    revisionCreatedOn: string;
    revisionModifiedOn: string | null;
    revisionSavedOn: string;
    revisionDeletedOn: string | null;
    revisionRestoredOn: string | null;
    revisionFirstPublishedOn: string | null;
    revisionLastPublishedOn: string | null;
    revisionCreatedBy: CmsIdentity;
    revisionModifiedBy: CmsIdentity | null;
    revisionSavedBy: CmsIdentity;
    revisionDeletedBy: CmsIdentity | null;
    revisionRestoredBy: CmsIdentity | null;
    revisionFirstPublishedBy: CmsIdentity | null;
    revisionLastPublishedBy: CmsIdentity | null;

    /**
     * Entry-level meta fields. 👇
     */
    createdOn: string;
    modifiedOn: string | null;
    savedOn: string;
    deletedOn: string | null;
    restoredOn: string | null;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    createdBy: CmsIdentity;
    modifiedBy: CmsIdentity | null;
    savedBy: CmsIdentity;
    deletedBy: CmsIdentity | null;
    restoredBy: CmsIdentity | null;
    firstPublishedBy: CmsIdentity | null;
    lastPublishedBy: CmsIdentity | null;

    /**
     * The rest. 👇
     */
    version: number;
    locked: boolean;
    status: CmsEntryStatus;
    location?: ICmsEntryLocation;
    wbyDeleted?: boolean | null;
    binOriginalFolderId?: string;
    values: GenericRecord;
    meta?: GenericRecord;
    state?: IEntryState;
}

export type IEntryEntityAttributes = IStandardEntityAttributes<IEntryEntityAttirbutesData>;

export type IModelEntity = IEntity<IStandardEntityAttributes<CmsModel>>;
export type IGroupEntity = IEntity<IStandardEntityAttributes<CmsGroup>>;
export type IEntryEntity = IEntity<IEntryEntityAttributes>;

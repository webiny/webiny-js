import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IGraphQLIdentityResponse } from "~tests/testHelpers/fields/index.js";
import type { CmsEntryStatus } from "~/types/index.js";

export type TestContext = ApiCoreContext;

/**
 * Query and reader related interfaces
 */
export interface IQueryParams<T> {
    variables?: T;
    headers?: GenericRecord<string, string>;
}
export interface IReadQueryBaseResponse<T> {
    id: string;
    entryId: string;
    createdOn: string;
    modifiedOn: string;
    savedOn: string;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    createdBy: IGraphQLIdentityResponse;
    modifiedBy: IGraphQLIdentityResponse;
    savedBy: IGraphQLIdentityResponse;
    firstPublishedBy: IGraphQLIdentityResponse | null;
    lastPublishedBy: IGraphQLIdentityResponse | null;
    revisionCreatedOn: string;
    revisionModifiedOn: string;
    revisionSavedOn: string;
    revisionFirstPublishedOn: string | null;
    revisionLastPublishedOn: string | null;
    revisionCreatedBy: IGraphQLIdentityResponse;
    revisionModifiedBy: IGraphQLIdentityResponse;
    revisionSavedBy: IGraphQLIdentityResponse;
    revisionFirstPublishedBy: IGraphQLIdentityResponse | null;
    revisionLastPublishedBy: IGraphQLIdentityResponse | null;
    values: T;
}

/**
 * Mutation and manager related interfaces
 */
export interface IMutationParams<T> {
    variables: T;
    headers?: GenericRecord<string, string>;
}

export interface IManageMutationBaseProperties {
    id: string;
    entryId: string;
    createdOn: string;
    modifiedOn: string;
    savedOn: string;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    createdBy: IGraphQLIdentityResponse;
    modifiedBy: IGraphQLIdentityResponse;
    savedBy: IGraphQLIdentityResponse;
    firstPublishedBy: IGraphQLIdentityResponse | null;
    lastPublishedBy: IGraphQLIdentityResponse | null;
    revisionCreatedOn: string;
    revisionModifiedOn: string;
    revisionSavedOn: string;
    revisionFirstPublishedOn: string | null;
    revisionLastPublishedOn: string | null;
    revisionCreatedBy: IGraphQLIdentityResponse;
    revisionModifiedBy: IGraphQLIdentityResponse;
    revisionSavedBy: IGraphQLIdentityResponse;
    revisionFirstPublishedBy: IGraphQLIdentityResponse | null;
    revisionLastPublishedBy: IGraphQLIdentityResponse | null;
    status: CmsEntryStatus;
}

export interface IManageMutationBaseEntry<T> extends Partial<IManageMutationBaseProperties> {
    values: T;
}

export interface IManageQueryBaseResponseMetaRevision<T> {
    id: string;
    values: T;
    meta: {
        status: string;
        version: number;
    };
}

export interface IManageQueryBaseResponseMeta<T> {
    title: string;
    modelId: string;
    version: number;
    locked: boolean;
    status: string;
    revisions: IManageQueryBaseResponseMetaRevision<T>[];
    data: GenericRecord;
}

export interface IManageQueryBaseResponseLocation {
    folderId: string;
}

export interface IManageQueryBaseResponse<T> {
    id: string;
    entryId: string;
    createdOn: string;
    modifiedOn: string;
    savedOn: string;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    createdBy: IGraphQLIdentityResponse;
    modifiedBy: IGraphQLIdentityResponse;
    savedBy: IGraphQLIdentityResponse;
    firstPublishedBy: IGraphQLIdentityResponse | null;
    lastPublishedBy: IGraphQLIdentityResponse | null;
    revisionCreatedOn: string;
    revisionModifiedOn: string;
    revisionSavedOn: string;
    revisionFirstPublishedOn: string | null;
    revisionLastPublishedOn: string | null;
    revisionCreatedBy: IGraphQLIdentityResponse;
    revisionModifiedBy: IGraphQLIdentityResponse;
    revisionSavedBy: IGraphQLIdentityResponse;
    revisionFirstPublishedBy: IGraphQLIdentityResponse | null;
    revisionLastPublishedBy: IGraphQLIdentityResponse | null;
    meta: IManageQueryBaseResponseMeta<T>;
    wbyAco_location: IManageQueryBaseResponseLocation;
    values: T;
}

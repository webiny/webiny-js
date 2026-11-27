import { parseIdentifier, zeroPad } from "@webiny/utils";
import WebinyError from "@webiny/error";

interface BasePartitionKeyParams {
    tenant: string;
}
const createBasePartitionKey = (params: BasePartitionKeyParams): string => {
    const { tenant } = params;
    if (!tenant) {
        throw new WebinyError(`Missing tenant variable when creating entry basePartitionKey`);
    }
    return `T#${tenant}#CMS#CME`;
};

export interface PartitionKeyParams extends BasePartitionKeyParams {
    id: string;
}
export const createPartitionKey = (params: PartitionKeyParams): string => {
    const { id: initialId } = params;
    const { id } = parseIdentifier(initialId);
    return `${createBasePartitionKey(params)}#${id}`;
};

export interface SortKeyParams {
    version: number;
}
export const createRevisionSortKey = (params: SortKeyParams): string => {
    return `REV#${zeroPad(params.version)}`;
};

export const createLatestSortKey = (): string => {
    return "L";
};

export const createPublishedSortKey = (): string => {
    return "P";
};

export interface GSIPartitionKeyParams {
    tenant: string;
    modelId: string;
}
export const createGSIPartitionKey = (params: GSIPartitionKeyParams, type: "A" | "L" | "P") => {
    const { modelId } = params;
    const partitionKey = createBasePartitionKey(params);
    return `${partitionKey}#M#${modelId}#${type}`;
};

export interface GSISortKeyParams {
    id: string;
}
export const createGSISortKey = (params: GSISortKeyParams): string => {
    return params.id;
};

export interface ICreateEntryPublishedKeysParams {
    id: string;
    modelId: string;
    expiresAt: number | null;
}

/**
 * The record's keys in the given tenant: the tenant of the storage operation's scope, never the one
 * the record carries.
 */
export const createEntryPublishedKeys = (
    params: ICreateEntryPublishedKeysParams,
    tenant: string
) => {
    const { id, modelId, expiresAt } = params;
    return {
        PK: createPartitionKey({ id, tenant }),
        SK: createPublishedSortKey(),
        GSI1_PK: createGSIPartitionKey({ tenant, modelId }, "P"),
        GSI1_SK: createGSISortKey(params),
        TYPE: `cms.entry.p`,
        GSI_TENANT: tenant,
        expiresAt
    };
};

export interface ICreateEntryLatestKeysParams {
    id: string;
    modelId: string;
    expiresAt: number | null;
}

/**
 * The record's keys in the given tenant: the tenant of the storage operation's scope, never the one
 * the record carries.
 */
export const createEntryLatestKeys = (params: ICreateEntryLatestKeysParams, tenant: string) => {
    const { id, modelId, expiresAt } = params;
    return {
        PK: createPartitionKey({ id, tenant }),
        SK: createLatestSortKey(),
        GSI1_PK: createGSIPartitionKey({ tenant, modelId }, "L"),
        GSI1_SK: createGSISortKey(params),
        TYPE: `cms.entry.l`,
        GSI_TENANT: tenant,
        expiresAt
    };
};

export interface ICreateRevisionKeysParams {
    id: string;
    version: number;
    modelId: string;
    expiresAt: number | null;
}

/**
 * The record's keys in the given tenant: the tenant of the storage operation's scope, never the one
 * the record carries.
 */
export const createEntryRevisionKeys = (params: ICreateRevisionKeysParams, tenant: string) => {
    const { id, modelId, expiresAt } = params;
    return {
        PK: createPartitionKey({ id, tenant }),
        SK: createRevisionSortKey(params),
        GSI1_PK: createGSIPartitionKey({ tenant, modelId }, "A"),
        GSI1_SK: createGSISortKey(params),
        TYPE: `cms.entry`,
        GSI_TENANT: tenant,
        expiresAt
    };
};

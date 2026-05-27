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
    tenant: string;
    modelId: string;
    expiresAt: number | null;
}

export const createEntryPublishedKeys = (params: ICreateEntryPublishedKeysParams) => {
    const { tenant, expiresAt } = params;
    return {
        PK: createPartitionKey(params),
        SK: createPublishedSortKey(),
        GSI1_PK: createGSIPartitionKey(params, "P"),
        GSI1_SK: createGSISortKey(params),
        TYPE: `cms.entry.p`,
        GSI_TENANT: tenant,
        expiresAt
    };
};

export interface ICreateEntryLatestKeysParams {
    id: string;
    tenant: string;
    modelId: string;
    expiresAt: number | null;
}

export const createEntryLatestKeys = (params: ICreateEntryLatestKeysParams) => {
    const { tenant, expiresAt } = params;
    return {
        PK: createPartitionKey(params),
        SK: createLatestSortKey(),
        GSI1_PK: createGSIPartitionKey(params, "L"),
        GSI1_SK: createGSISortKey(params),
        TYPE: `cms.entry.l`,
        GSI_TENANT: tenant,
        expiresAt
    };
};

export interface ICreateRevisionKeysParams {
    id: string;
    tenant: string;
    version: number;
    modelId: string;
    expiresAt: number | null;
}

export const createEntryRevisionKeys = (params: ICreateRevisionKeysParams) => {
    const { tenant, expiresAt } = params;
    return {
        PK: createPartitionKey(params),
        SK: createRevisionSortKey(params),
        GSI1_PK: createGSIPartitionKey(params, "A"),
        GSI1_SK: createGSISortKey(params),
        TYPE: `cms.entry`,
        GSI_TENANT: tenant,
        expiresAt
    };
};

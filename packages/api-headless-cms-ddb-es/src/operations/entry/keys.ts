import { parseIdentifier, zeroPad } from "@webiny/utils";

export interface PartitionKeyParams {
    id: string;
    tenant: string;
}
export const createPartitionKey = (params: PartitionKeyParams): string => {
    const { tenant, id: initialId } = params;
    const { id } = parseIdentifier(initialId);
    return `T#${tenant}#CMS#CME#${id}`;
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

export interface ICreateEntryPublishedKeysParams {
    id: string;
}

/**
 * The tenant is passed separately from the record: it is the storage scope's tenant, never one read
 * off the record.
 */
export const createEntryPublishedKeys = (
    params: ICreateEntryPublishedKeysParams,
    tenant: string
) => {
    const { id } = params;
    return {
        PK: createPartitionKey({
            id,
            tenant
        }),
        SK: createPublishedSortKey(),
        TYPE: `cms.entry.p`,
        GSI_TENANT: tenant
    };
};

export interface ICreateEntryLatestKeysParams {
    id: string;
}

export const createEntryLatestKeys = (params: ICreateEntryLatestKeysParams, tenant: string) => {
    const { id } = params;
    return {
        PK: createPartitionKey({
            id,
            tenant
        }),
        SK: createLatestSortKey(),
        TYPE: `cms.entry.l`,
        GSI_TENANT: tenant
    };
};

export interface ICreateRevisionKeysParams {
    id: string;
    version: number;
}

export const createEntryRevisionKeys = (params: ICreateRevisionKeysParams, tenant: string) => {
    const { id, version } = params;
    return {
        PK: createPartitionKey({
            id,
            tenant
        }),
        SK: createRevisionSortKey({
            version
        }),
        TYPE: `cms.entry`,
        GSI_TENANT: tenant
    };
};

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
    tenant: string;
}

export const createEntryPublishedKeys = (params: ICreateEntryPublishedKeysParams) => {
    const { id, tenant } = params;
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
    tenant: string;
}

export const createEntryLatestKeys = (params: ICreateEntryLatestKeysParams) => {
    const { id, tenant } = params;
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
    tenant: string;
    version: number;
}

export const createEntryRevisionKeys = (params: ICreateRevisionKeysParams) => {
    const { id, tenant, version } = params;
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

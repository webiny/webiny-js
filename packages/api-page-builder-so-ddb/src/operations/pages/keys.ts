import { parseIdentifier } from "@webiny/utils";

interface BasePartitionKeyParams {
    tenant: string;
    locale: string;
}
const createBasePartitionKey = (params: BasePartitionKeyParams): string => {
    const { tenant, locale } = params;
    return `T#${tenant}#L#${locale}#PB`;
};

export const createPublishedPartitionKey = (params: BasePartitionKeyParams): string => {
    return `${createBasePartitionKey(params)}#P`;
};

export interface PublishedSortKeyParams {
    id: string;
}
export const createPublishedSortKey = (params: PublishedSortKeyParams): string => {
    const { id } = parseIdentifier(params.id);

    return id;
};

export const createLatestPartitionKey = (params: BasePartitionKeyParams): string => {
    return `${createBasePartitionKey(params)}#L`;
};

export interface LatestSortKeyParams {
    pid?: string;
    id: string;
}
export const createLatestSortKey = (params: LatestSortKeyParams): string => {
    const { id } = parseIdentifier(params.pid || params.id);
    return id;
};

export const createPathPartitionKey = (params: BasePartitionKeyParams): string => {
    return `${createBasePartitionKey(params)}#PATH`;
};

export interface PathSortKeyParams {
    path: string;
}
export const createPathSortKey = (params: PathSortKeyParams): string => {
    return params.path;
};

export interface RevisionPartitionKeyParams extends BasePartitionKeyParams {
    id: string;
}
export const createRevisionPartitionKey = (params: RevisionPartitionKeyParams): string => {
    const { id } = parseIdentifier(params.id);
    return `${createBasePartitionKey(params)}#${id}`;
};

export interface RevisionSortKeyParams {
    version: string | number;
}
export const createRevisionSortKey = (params: RevisionSortKeyParams): string => {
    return String(params.version);
};

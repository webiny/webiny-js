import { parseIdentifier, zeroPad } from "@webiny/utils";

interface BasePartitionKeyParams {
    tenant: string;
    locale: string;
}

const createBasePartitionKey = (params: BasePartitionKeyParams): string => {
    const { tenant, locale } = params;
    return `T#${tenant}#L#${locale}#PB#`;
};

export interface PartitionKeyParams extends BasePartitionKeyParams {
    id: string;
}

export const createPartitionKey = (params: PartitionKeyParams): string => {
    const { id } = parseIdentifier(params.id);
    return `${createBasePartitionKey(params)}P#${id}`;
};

export interface SortKeyParams {
    version: number;
}

export const createSortKey = (params: SortKeyParams): string => {
    return `REV#${zeroPad(params.version)}`;
};

export const createPathPartitionKey = (params: BasePartitionKeyParams): string => {
    return `${createBasePartitionKey(params)}PATH`;
};

export interface PathSortKeyParams {
    path: string;
}

export const createPathSortKey = (params: PathSortKeyParams): string => {
    return params.path;
};

export const createPublishedSortKey = (): string => {
    return "P";
};

export const createLatestSortKey = (): string => {
    return "L";
};

export const createBasicType = (): string => {
    return "pb.page";
};

export const createLatestType = (): string => {
    return "pb.page.l";
};

export const createPublishedType = (): string => {
    return "pb.page.p";
};

export const createPublishedPathType = (): string => {
    return "pb.page.p.path";
};

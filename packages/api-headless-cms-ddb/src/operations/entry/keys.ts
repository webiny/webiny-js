import { parseIdentifier, zeroPad } from "@webiny/utils";

interface BasePartitionKeyParams {
    tenant: string;
    locale: string;
}
const createBasePartitionKey = (params: BasePartitionKeyParams): string => {
    const { tenant, locale } = params;
    return `T#${tenant}#L#${locale}#CMS#CME`;
};

export interface PartitionKeyParams extends BasePartitionKeyParams {
    id: string;
}
export const createPartitionKey = (params: PartitionKeyParams): string => {
    const { id: initialId } = params;
    const { id } = parseIdentifier(initialId);
    return `${createBasePartitionKey(params)}#CME#${id}`;
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
    locale: string;
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

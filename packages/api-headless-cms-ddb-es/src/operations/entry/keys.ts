import { parseIdentifier, zeroPad } from "@webiny/utils";

export interface PartitionKeyParams {
    id: string;
    tenant: string;
    locale: string;
}
export const createPartitionKey = (params: PartitionKeyParams): string => {
    const { tenant, locale, id: initialId } = params;
    const { id } = parseIdentifier(initialId);
    return `T#${tenant}#L#${locale}#CMS#CME#${id}`;
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

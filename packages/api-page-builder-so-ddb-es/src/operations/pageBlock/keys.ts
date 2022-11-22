export interface PartitionKeyParams {
    tenant: string;
    locale: string;
}
export const createPartitionKey = (params: PartitionKeyParams): string => {
    const { tenant, locale } = params;
    return `T#${tenant}#L#${locale}#PB#B`;
};

export interface SortKeyParams {
    id: string;
}
export const createSortKey = (params: SortKeyParams): string => {
    const { id } = params;
    return id;
};

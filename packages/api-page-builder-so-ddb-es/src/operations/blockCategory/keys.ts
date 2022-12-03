export interface PartitionKeyParams {
    tenant: string;
    locale: string;
}
export const createPartitionKey = (params: PartitionKeyParams): string => {
    const { tenant, locale } = params;
    return `T#${tenant}#L#${locale}#PB#BC`;
};

export interface SortKeyParams {
    slug: string;
}
export const createSortKey = (params: SortKeyParams): string => {
    const { slug } = params;
    return slug;
};

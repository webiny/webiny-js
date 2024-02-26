export interface PartitionKeyParams {
    tenant: string;
    locale: string;
    id: string;
}

export interface GSIPartitionKeyParams {
    tenant: string;
    locale: string;
}

export interface GSISortKeyParams {
    blockCategory: string;
    id: string;
}

export const createPartitionKey = (params: PartitionKeyParams): string => {
    const { tenant, locale, id } = params;
    return `T#${tenant}#L#${locale}#PB#BLOCK#${id}`;
};

export const createGSIPartitionKey = (params: GSIPartitionKeyParams): string => {
    const { tenant, locale } = params;
    return `T#${tenant}#L#${locale}#PB#BLOCKS`;
};

export const createGSISortKey = (params: GSISortKeyParams): string => {
    const { id, blockCategory } = params;
    return `${blockCategory}#${id}`;
};

export interface SortKeyParams {
    id: string;
}
export const createSortKey = (): string => {
    return "A";
};

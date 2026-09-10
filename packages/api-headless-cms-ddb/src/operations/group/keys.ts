interface PartitionKeyParams {
    tenant: string;
}

export const createPartitionKey = (params: PartitionKeyParams): string => {
    const { tenant } = params;
    return `T#${tenant}#CMS#CMG`;
};

interface SortKeyParams {
    id: string;
}

const createSortKeys = (params: SortKeyParams): string => {
    const { id } = params;
    return id;
};

interface Keys {
    PK: string;
    SK: string;
    GSI_TENANT: string;
}

export const createKeys = (params: PartitionKeyParams & SortKeyParams): Keys => {
    return {
        PK: createPartitionKey(params),
        SK: createSortKeys(params),
        GSI_TENANT: params.tenant
    };
};

export const createType = (): string => {
    return "cms.group";
};

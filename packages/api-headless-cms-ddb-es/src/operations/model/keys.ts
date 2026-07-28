interface PartitionKeysParams {
    tenant: string;
}

export const createPartitionKey = (params: PartitionKeysParams): string => {
    const { tenant } = params;
    return `T#${tenant}#CMS#CM`;
};

interface SortKeyParams {
    modelId: string;
}

const createSortKey = (params: SortKeyParams): string => {
    return params.modelId;
};

interface Keys {
    PK: string;
    SK: string;
    GSI_TENANT: string;
}

export const createKeys = (params: PartitionKeysParams & SortKeyParams): Keys => {
    if (!params.tenant) {
        throw new Error("Missing tenant when creating model keys!");
    }
    return {
        PK: createPartitionKey(params),
        SK: createSortKey(params),
        GSI_TENANT: params.tenant
    };
};

export const createType = (): string => {
    return "cms.model";
};

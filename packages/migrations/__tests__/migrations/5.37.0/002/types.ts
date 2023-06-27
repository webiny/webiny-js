export interface CreatedBy {
    id: string;
    type: string;
    displayName: string;
}

export interface LocaleDdbItem {
    PK: string;
    SK: string;
    code: string;
    default: boolean;
    createdOn: string;
    createdBy: CreatedBy;
    tenant: string;
    webinyVersion: string;
}

export interface TenantDdbItem {
    PK: string;
    SK: string;
    createdOn: string;
    description: string;
    GSI1_PK: string;
    GSI1_SK: string;
    data: {
        id: string;
        name: string;
        parent?: string | null;
        savedOn: string;
        settings: {
            domains: string[];
        };
        status: string;
        TYPE: string;
        webinyVersion: string;
        createdBy: CreatedBy;
    };
}

export interface FolderDdbToElasticsearchWriteItem {
    PK: string;
    SK: string;
    index: string;
    data: any;
}

export interface FolderDdbWriteItem extends FolderItem {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
}

export type FolderDdbEsWriteItem = Omit<FolderDdbWriteItem, "GSI1_PK" | "GSI1_SK">;

export interface FolderItem {
    id: string;
    entryId: string;
    locale: string;
    tenant: string;
    locked: boolean;
    modelId: string;
    status: string;
    TYPE: string;
    values: {
        title: string;
        slug: string;
        parentId?: string | null;
        type: string;
    };
}

export interface FolderDdbItem {
    PK: string;
    id: string;
    locale: string;
    tenant: string;
}

export interface FolderDdbEsItem {
    PK: string;
}

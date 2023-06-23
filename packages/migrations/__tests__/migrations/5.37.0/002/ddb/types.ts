export interface FolderDdbWriteItem {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
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

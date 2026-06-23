export interface IEntryRow {
    id: string;
    entryId: string;
    modelId: string;
    tenant: string;
    version: number;
    isLatest: boolean;
    isPublished: boolean;
    wbyDeleted: boolean;
    data: string;
}

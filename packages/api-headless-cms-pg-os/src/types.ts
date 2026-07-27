export interface ISyncRow {
    id: string;
    entryId: string;
    index: string;
    operation: string;
    data: string;
    tenant: string;
}

export type SyncEventType = "INSERT" | "MODIFY" | "REMOVE";

export interface SyncEvent {
    type: SyncEventType;
    id: string;
    entryId: string;
    tenant: string;
    index: string;
    data?: string;
}

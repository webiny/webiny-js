export interface PgWalChangeRecordData {
    compression: string;
    value: string;
}

export interface PgWalChangeRecord {
    id: string;
    entryId: string;
    index: string;
    operation: string;
    data: PgWalChangeRecordData;
    tenant: string;
}

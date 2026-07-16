export interface PgWalChangeRecord {
    id: string;
    entryId: string;
    index: string;
    operation: string;
    data: string;
    tenant: string;
}

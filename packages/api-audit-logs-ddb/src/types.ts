import type { IAuditLog } from "@webiny/api-audit-logs/storage/types.js";

export interface IStorageAuditLog extends Omit<IAuditLog, "createdOn" | "content" | "expiresAt"> {
    expiresAt: string;
    createdOn: string;
    content: string;
}

export interface IStorageItem {
    PK: string;
    SK: string;
    TYPE: string;
    GSI_TENANT: string;
    GSI1_PK: string;
    GSI1_SK: number;
    GSI2_PK: string;
    GSI2_SK: number;
    GSI3_PK: string;
    GSI3_SK: number;
    GSI4_PK: string;
    GSI4_SK: number;
    GSI5_PK: string;
    GSI5_SK: number;
    GSI6_PK: string;
    GSI6_SK: number;
    GSI7_PK: string;
    GSI7_SK: number;
    GSI8_PK: string;
    GSI8_SK: number;
    GSI9_PK: string;
    GSI9_SK: number;

    data: IStorageAuditLog;
    expiresAt: number;
}

export interface IIndexStorageItem {
    PK: string;
    SK: string;
}

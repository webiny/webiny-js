import type { IAuditLog } from "@webiny/api-audit-logs/storage/types.js";
import type { IStorageItem } from "~/types.js";

export interface IConverter {
    oneFromStorage(item: IStorageItem): Promise<IAuditLog>;
    listFromStorage(items: IStorageItem[]): Promise<IAuditLog[]>;
    oneToStorage(auditLog: IAuditLog): Promise<IStorageItem>;
}

import type { IAuditLog, IStorageItem } from "~/storage/types.js";

export interface IConverter {
    oneFromStorage(item: IStorageItem): Promise<IAuditLog>;
    listFromStorage(items: IStorageItem[]): Promise<IAuditLog[]>;
    oneToStorage(auditLog: IAuditLog): Promise<IStorageItem>;
}

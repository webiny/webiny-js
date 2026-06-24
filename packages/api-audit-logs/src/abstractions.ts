import { createAbstraction } from "@webiny/feature/api";
import type { AuditLogsContextValue } from "~/types.js";
import type { IStorage } from "~/storage/abstractions/Storage.js";

export const AuditLogsContext = createAbstraction<AuditLogsContextValue>("AuditLogsContext");

export namespace AuditLogsContext {
    export type Interface = AuditLogsContextValue;
}

export const AuditLogsStorage = createAbstraction<IStorage>("AuditLogsStorage");

export namespace AuditLogsStorage {
    export type Interface = IStorage;
}

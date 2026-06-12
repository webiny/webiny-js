import { createAbstraction } from "@webiny/feature/api";
import type { AuditLogsContext as Context } from "~/types.js";
import type { IStorage } from "~/storage/abstractions/Storage.js";

// TODO: this is a bridge for legacy context; needs review and refactor of code that uses it.

export const AuditLogsContext = createAbstraction<Context>("AuditLogsContext");

export namespace AuditLogsContext {
    export type Interface = Context;
}

export const AuditLogsStorage = createAbstraction<IStorage>("AuditLogsStorage");

export namespace AuditLogsStorage {
    export type Interface = IStorage;
}

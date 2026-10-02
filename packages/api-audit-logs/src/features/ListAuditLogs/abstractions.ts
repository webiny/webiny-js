import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IListAuditLogsParams } from "~/types.js";
import type { IListAuditLogsResultMeta } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";
import type { AuditLogPersistenceError } from "~/domain/errors.js";

export interface ListAuditLogsOutput {
    items: IAuditLog[];
    meta: IListAuditLogsResultMeta;
}

/**
 * ListAuditLogs Use Case - Lists audit logs of the current tenant.
 */
export interface IListAuditLogsUseCase {
    execute(
        params: IListAuditLogsParams
    ): Promise<Result<ListAuditLogsOutput, AuditLogPersistenceError>>;
}

export const ListAuditLogsUseCase =
    createAbstraction<IListAuditLogsUseCase>("ListAuditLogsUseCase");

export namespace ListAuditLogsUseCase {
    export type Interface = IListAuditLogsUseCase;
    export type Output = ListAuditLogsOutput;
}

/**
 * ListAuditLogsRepository - Lists audit logs of the current tenant.
 */
export interface IListAuditLogsRepository {
    list(
        params: IListAuditLogsParams
    ): Promise<Result<ListAuditLogsOutput, AuditLogPersistenceError>>;
}

export const ListAuditLogsRepository =
    createAbstraction<IListAuditLogsRepository>("ListAuditLogsRepository");

export namespace ListAuditLogsRepository {
    export type Interface = IListAuditLogsRepository;
}

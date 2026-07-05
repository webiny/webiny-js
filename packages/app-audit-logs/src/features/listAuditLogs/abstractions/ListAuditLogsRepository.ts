import { createAbstraction } from "@webiny/feature/admin";
import type { IAuditLog, IAuditLogsMeta } from "~/types.js";

export interface IListAuditLogsRepositoryParams {
    where?: Record<string, unknown>;
    after?: string;
    sort?: "ASC" | "DESC";
    limit?: number;
}

export interface IListAuditLogsRepositoryResult {
    records: IAuditLog[];
    meta: IAuditLogsMeta;
}

export interface IListAuditLogsRepository {
    execute(params: IListAuditLogsRepositoryParams): Promise<IListAuditLogsRepositoryResult>;
}

export const ListAuditLogsRepository =
    createAbstraction<IListAuditLogsRepository>("ListAuditLogsRepository");

export namespace ListAuditLogsRepository {
    export type Interface = IListAuditLogsRepository;
    export type Params = IListAuditLogsRepositoryParams;
    export type Result = IListAuditLogsRepositoryResult;
}

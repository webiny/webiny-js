import { createAbstraction } from "@webiny/feature/admin";
import type { IAuditLog, IAuditLogsMeta } from "~/types.js";

export interface IListAuditLogsUseCaseParams {
    where?: Record<string, unknown>;
    after?: string;
    sort?: "ASC" | "DESC";
    limit?: number;
}

export interface IListAuditLogsUseCaseResult {
    records: IAuditLog[];
    meta: IAuditLogsMeta;
}

export interface IListAuditLogsUseCase {
    execute(params: IListAuditLogsUseCaseParams): Promise<IListAuditLogsUseCaseResult>;
}

export const ListAuditLogsUseCase =
    createAbstraction<IListAuditLogsUseCase>("ListAuditLogsUseCase");

export namespace ListAuditLogsUseCase {
    export type Interface = IListAuditLogsUseCase;
    export type Params = IListAuditLogsUseCaseParams;
    export type Result = IListAuditLogsUseCaseResult;
}

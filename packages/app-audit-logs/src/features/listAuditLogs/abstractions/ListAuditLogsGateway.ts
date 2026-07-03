import { createAbstraction } from "@webiny/feature/admin";
import type { IAuditLogRaw, IAuditLogsMeta } from "~/types.js";

export interface IListAuditLogsGatewayParams {
    where?: Record<string, unknown>;
    after?: string;
    sort?: "ASC" | "DESC";
    limit?: number;
}

export interface IListAuditLogsGatewayResult {
    data: IAuditLogRaw[];
    meta: IAuditLogsMeta;
}

export interface IListAuditLogsGateway {
    execute(params: IListAuditLogsGatewayParams): Promise<IListAuditLogsGatewayResult>;
}

export const ListAuditLogsGateway =
    createAbstraction<IListAuditLogsGateway>("ListAuditLogsGateway");

export namespace ListAuditLogsGateway {
    export type Interface = IListAuditLogsGateway;
    export type Params = IListAuditLogsGatewayParams;
    export type Result = IListAuditLogsGatewayResult;
}

import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { IListAuditLogsParams } from "~/types.js";
import type { IListAuditLogsResultMeta } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";
import type { IStorageListParams } from "~/storage/abstractions/Storage.js";
import type { IStorageListSuccessResultMeta } from "~/storage/abstractions/Storage.js";
import type { AuditLogPersistenceError } from "~/domain/errors.js";

export interface ListAuditLogsOutput {
    items: IAuditLog[];
    meta: IListAuditLogsResultMeta;
}

/**
 * ListAuditLogs Use Case - Lists audit logs of the current tenant. Needs access to all audit logs.
 */
export interface IListAuditLogsUseCase {
    execute(params: IListAuditLogsParams): Promise<Result<ListAuditLogsOutput, UseCaseError>>;
}

export interface IListAuditLogsUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    persistence: AuditLogPersistenceError;
}

type UseCaseError = IListAuditLogsUseCaseErrors[keyof IListAuditLogsUseCaseErrors];

export const ListAuditLogsUseCase =
    createAbstraction<IListAuditLogsUseCase>("ListAuditLogsUseCase");

export namespace ListAuditLogsUseCase {
    export type Interface = IListAuditLogsUseCase;
    export type Output = ListAuditLogsOutput;
    export type Error = UseCaseError;
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

export interface ListAuditLogsGatewayOutput {
    items: IAuditLog[];
    meta: IStorageListSuccessResultMeta;
}

/**
 * ListAuditLogsGateway - Lists audit logs from the audit logs storage.
 */
export interface IListAuditLogsGateway {
    list(params: IStorageListParams): Promise<ListAuditLogsGatewayOutput>;
}

export const ListAuditLogsGateway =
    createAbstraction<IListAuditLogsGateway>("ListAuditLogsGateway");

export namespace ListAuditLogsGateway {
    export type Interface = IListAuditLogsGateway;
    export type Output = ListAuditLogsGatewayOutput;
}

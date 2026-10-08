import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { IAuditLog } from "~/storage/types.js";
import type { IStorageFetchParams } from "~/storage/abstractions/Storage.js";
import type { AuditLogPersistenceError } from "~/domain/errors.js";

/**
 * GetAuditLog Use Case - Gets an audit log of the current tenant by its id.
 */
export interface IGetAuditLogUseCase {
    execute(id: string): Promise<Result<IAuditLog, UseCaseError>>;
}

export interface IGetAuditLogUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    persistence: AuditLogPersistenceError;
}

type UseCaseError = IGetAuditLogUseCaseErrors[keyof IGetAuditLogUseCaseErrors];

export const GetAuditLogUseCase = createAbstraction<IGetAuditLogUseCase>("GetAuditLogUseCase");

export namespace GetAuditLogUseCase {
    export type Interface = IGetAuditLogUseCase;
    export type Error = UseCaseError;
}

/**
 * GetAuditLogRepository - Fetches an audit log of the current tenant.
 */
export interface IGetAuditLogRepository {
    get(id: string): Promise<Result<IAuditLog, AuditLogPersistenceError>>;
}

export const GetAuditLogRepository =
    createAbstraction<IGetAuditLogRepository>("GetAuditLogRepository");

export namespace GetAuditLogRepository {
    export type Interface = IGetAuditLogRepository;
}

/**
 * GetAuditLogGateway - Reads an audit log from the audit logs storage.
 */
export interface IGetAuditLogGateway {
    get(params: IStorageFetchParams): Promise<IAuditLog>;
}

export const GetAuditLogGateway = createAbstraction<IGetAuditLogGateway>("GetAuditLogGateway");

export namespace GetAuditLogGateway {
    export type Interface = IGetAuditLogGateway;
}

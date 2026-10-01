import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { AuditLogPayload } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";
import type { AuditLogPersistenceError } from "~/domain/errors.js";

/**
 * CreateAuditLog Use Case - Creates an audit log in the current tenant, as the current identity.
 */
export interface ICreateAuditLogUseCase {
    execute(payload: AuditLogPayload): Promise<Result<IAuditLog, UseCaseError>>;
}

export interface ICreateAuditLogUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    persistence: AuditLogPersistenceError;
}

type UseCaseError = ICreateAuditLogUseCaseErrors[keyof ICreateAuditLogUseCaseErrors];

export const CreateAuditLogUseCase =
    createAbstraction<ICreateAuditLogUseCase>("CreateAuditLogUseCase");

export namespace CreateAuditLogUseCase {
    export type Interface = ICreateAuditLogUseCase;
    export type Error = UseCaseError;
}

/**
 * CreateAuditLogRepository - Stores a new audit log.
 */
export interface ICreateAuditLogRepository {
    create(auditLog: IAuditLog): Promise<Result<IAuditLog, AuditLogPersistenceError>>;
}

export const CreateAuditLogRepository = createAbstraction<ICreateAuditLogRepository>(
    "CreateAuditLogRepository"
);

export namespace CreateAuditLogRepository {
    export type Interface = ICreateAuditLogRepository;
}

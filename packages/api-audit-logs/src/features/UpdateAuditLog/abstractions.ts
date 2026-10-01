import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { AuditLogPayload } from "~/types.js";
import type { IAuditLog } from "~/storage/types.js";
import type { AuditLogPersistenceError } from "~/domain/errors.js";

/**
 * UpdateAuditLog Use Case - Updates an existing audit log with new values.
 */
export interface IUpdateAuditLogUseCase {
    execute(
        original: IAuditLog,
        payload: Partial<AuditLogPayload>
    ): Promise<Result<IAuditLog, UseCaseError>>;
}

export interface IUpdateAuditLogUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    persistence: AuditLogPersistenceError;
}

type UseCaseError = IUpdateAuditLogUseCaseErrors[keyof IUpdateAuditLogUseCaseErrors];

export const UpdateAuditLogUseCase =
    createAbstraction<IUpdateAuditLogUseCase>("UpdateAuditLogUseCase");

export namespace UpdateAuditLogUseCase {
    export type Interface = IUpdateAuditLogUseCase;
    export type Error = UseCaseError;
}

/**
 * UpdateAuditLogRepository - Stores an updated audit log.
 */
export interface IUpdateAuditLogRepository {
    update(auditLog: IAuditLog): Promise<Result<IAuditLog, AuditLogPersistenceError>>;
}

export const UpdateAuditLogRepository = createAbstraction<IUpdateAuditLogRepository>(
    "UpdateAuditLogRepository"
);

export namespace UpdateAuditLogRepository {
    export type Interface = IUpdateAuditLogRepository;
}

import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import {
    TenantModelNotFoundError,
    TenantNotFoundError,
    TenantPersistenceError
} from "../../domain/errors.js";

export interface IDisableTenantUseCase {
    execute(tenantId: string): Promise<Result<void, DisableTenantUseCase.Error>>;
}

export interface IDisableTenantUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    notFound: TenantNotFoundError;
    persistence: TenantPersistenceError;
    modelNotFound: TenantModelNotFoundError;
}

type UseCaseError = IDisableTenantUseCaseErrors[keyof IDisableTenantUseCaseErrors];

export const DisableTenantUseCase =
    createAbstraction<IDisableTenantUseCase>("DisableTenantUseCase");

export namespace DisableTenantUseCase {
    export type Interface = IDisableTenantUseCase;
    export type Error = UseCaseError;
}

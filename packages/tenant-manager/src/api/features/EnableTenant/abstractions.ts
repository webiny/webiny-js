import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import {
    TenantModelNotFoundError,
    TenantNotFoundError,
    TenantPersistenceError
} from "../../domain/errors.js";

export interface IEnableTenantUseCase {
    execute(tenantId: string): Promise<Result<void, EnableTenantUseCase.Error>>;
}

export interface IEnableTenantUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    notFound: TenantNotFoundError;
    persistence: TenantPersistenceError;
    modelNotFound: TenantModelNotFoundError;
}

type UseCaseError = IEnableTenantUseCaseErrors[keyof IEnableTenantUseCaseErrors];

export const EnableTenantUseCase = createAbstraction<IEnableTenantUseCase>("EnableTenantUseCase");

export namespace EnableTenantUseCase {
    export type Interface = IEnableTenantUseCase;
    export type Error = UseCaseError;
}

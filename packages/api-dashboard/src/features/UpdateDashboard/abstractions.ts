import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { DashboardLayout } from "~/domain/types.js";
import type { DashboardNotAuthenticatedError } from "~/domain/errors.js";
import type { DashboardPersistenceError } from "~/domain/errors.js";
import type { DashboardValidationError } from "~/domain/errors.js";

/**
 * UpdateDashboard Use Case - Stores the current identity's dashboard, creating it on first use.
 */
export interface IUpdateDashboardUseCase {
    execute(layout: DashboardLayout): Promise<Result<DashboardLayout, UseCaseError>>;
}

export interface IUpdateDashboardUseCaseErrors {
    notAuthenticated: DashboardNotAuthenticatedError;
    validation: DashboardValidationError;
    persistence: DashboardPersistenceError;
}

type UseCaseError = IUpdateDashboardUseCaseErrors[keyof IUpdateDashboardUseCaseErrors];

export const UpdateDashboardUseCase =
    createAbstraction<IUpdateDashboardUseCase>("UpdateDashboardUseCase");

export namespace UpdateDashboardUseCase {
    export type Interface = IUpdateDashboardUseCase;
    export type Error = UseCaseError;
}

/**
 * UpdateDashboardRepository - Writes an owner's dashboard layout to storage.
 */
export interface IUpdateDashboardRepository {
    save(
        ownerId: string,
        layout: DashboardLayout
    ): Promise<Result<DashboardLayout, RepositoryError>>;
}

type RepositoryError = DashboardPersistenceError;

export const UpdateDashboardRepository = createAbstraction<IUpdateDashboardRepository>(
    "UpdateDashboardRepository"
);

export namespace UpdateDashboardRepository {
    export type Interface = IUpdateDashboardRepository;
    export type Error = RepositoryError;
}

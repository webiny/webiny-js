import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { DashboardLayout } from "~/domain/types.js";
import type { DashboardNotAuthenticatedError } from "~/domain/errors.js";
import type { DashboardPersistenceError } from "~/domain/errors.js";

/**
 * SaveMyDashboard Use Case - Stores the current identity's dashboard layout.
 */
export interface ISaveMyDashboardUseCase {
    execute(layout: DashboardLayout): Promise<Result<DashboardLayout, UseCaseError>>;
}

export interface ISaveMyDashboardUseCaseErrors {
    notAuthenticated: DashboardNotAuthenticatedError;
    persistence: DashboardPersistenceError;
}

type UseCaseError = ISaveMyDashboardUseCaseErrors[keyof ISaveMyDashboardUseCaseErrors];

export const SaveMyDashboardUseCase =
    createAbstraction<ISaveMyDashboardUseCase>("SaveMyDashboardUseCase");

export namespace SaveMyDashboardUseCase {
    export type Interface = ISaveMyDashboardUseCase;
    export type Error = UseCaseError;
}

/**
 * SaveMyDashboardRepository - Creates or updates an owner's dashboard entry.
 */
export interface ISaveMyDashboardRepository {
    save(
        ownerId: string,
        layout: DashboardLayout
    ): Promise<Result<DashboardLayout, RepositoryError>>;
}

type RepositoryError = DashboardPersistenceError;

export const SaveMyDashboardRepository = createAbstraction<ISaveMyDashboardRepository>(
    "SaveMyDashboardRepository"
);

export namespace SaveMyDashboardRepository {
    export type Interface = ISaveMyDashboardRepository;
    export type Error = RepositoryError;
}

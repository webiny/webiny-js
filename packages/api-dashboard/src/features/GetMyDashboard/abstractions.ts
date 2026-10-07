import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { DashboardLayout } from "~/domain/types.js";
import type { DashboardNotAuthenticatedError } from "~/domain/errors.js";
import type { DashboardPersistenceError } from "~/domain/errors.js";

/**
 * GetMyDashboard Use Case - Returns the current identity's dashboard layout, or `null` when the
 * identity never customized its dashboard.
 */
export interface IGetMyDashboardUseCase {
    execute(): Promise<Result<DashboardLayout | null, UseCaseError>>;
}

export interface IGetMyDashboardUseCaseErrors {
    notAuthenticated: DashboardNotAuthenticatedError;
    persistence: DashboardPersistenceError;
}

type UseCaseError = IGetMyDashboardUseCaseErrors[keyof IGetMyDashboardUseCaseErrors];

export const GetMyDashboardUseCase =
    createAbstraction<IGetMyDashboardUseCase>("GetMyDashboardUseCase");

export namespace GetMyDashboardUseCase {
    export type Interface = IGetMyDashboardUseCase;
    export type Error = UseCaseError;
}

/**
 * GetMyDashboardRepository - Loads an owner's dashboard layout from storage.
 */
export interface IGetMyDashboardRepository {
    get(ownerId: string): Promise<Result<DashboardLayout | null, RepositoryError>>;
}

type RepositoryError = DashboardPersistenceError;

export const GetMyDashboardRepository = createAbstraction<IGetMyDashboardRepository>(
    "GetMyDashboardRepository"
);

export namespace GetMyDashboardRepository {
    export type Interface = IGetMyDashboardRepository;
    export type Error = RepositoryError;
}

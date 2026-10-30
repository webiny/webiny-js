import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { DashboardLayout } from "~/domain/types.js";
import type { DashboardNotAuthenticatedError } from "~/domain/errors.js";
import type { DashboardPersistenceError } from "~/domain/errors.js";

/**
 * ListDashboards Use Case - Returns the current identity's dashboards. Each identity has at most
 * one today, and none until it customizes the dashboard.
 */
export interface IListDashboardsUseCase {
    execute(): Promise<Result<DashboardLayout[], UseCaseError>>;
}

export interface IListDashboardsUseCaseErrors {
    notAuthenticated: DashboardNotAuthenticatedError;
    persistence: DashboardPersistenceError;
}

type UseCaseError = IListDashboardsUseCaseErrors[keyof IListDashboardsUseCaseErrors];

export const ListDashboardsUseCase =
    createAbstraction<IListDashboardsUseCase>("ListDashboardsUseCase");

export namespace ListDashboardsUseCase {
    export type Interface = IListDashboardsUseCase;
    export type Error = UseCaseError;
}

/**
 * ListDashboardsRepository - Loads an owner's dashboard layout from storage, or `null` if none is stored.
 */
export interface IListDashboardsRepository {
    get(ownerId: string): Promise<Result<DashboardLayout | null, RepositoryError>>;
}

type RepositoryError = DashboardPersistenceError;

export const ListDashboardsRepository = createAbstraction<IListDashboardsRepository>(
    "ListDashboardsRepository"
);

export namespace ListDashboardsRepository {
    export type Interface = IListDashboardsRepository;
    export type Error = RepositoryError;
}

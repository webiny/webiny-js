import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Team } from "@webiny/api-security/types.js";
import { AdminUsersRepository } from "~/features/shared/abstractions.js";

// Use case specific errors - none for this use case
export interface IListUserTeamsErrors {
    // No specific errors beyond repository errors
}

// Combined error type (use case errors + repository errors)
type ListUserTeamsError = AdminUsersRepository.Error;

// Use case interface
export interface IListUserTeams {
    execute(userId: string): Promise<Result<Team[], ListUserTeamsError>>;
}

// Abstraction constant
export const ListUserTeamsUseCase = createAbstraction<IListUserTeams>("ListUserTeamsUseCase");

// Namespace exports
export namespace ListUserTeamsUseCase {
    export type Interface = IListUserTeams;
    export type Error = ListUserTeamsError;
}

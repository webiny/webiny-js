import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "~/features/users/shared/types.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";

export interface FindUserRecordsOptions {
    /**
     * Also probe every installed tenant, instead of trusting a non-empty index result.
     * Records written before the user→tenant index existed are only found this way, so
     * anything that acts on "the user has no other tenant" (deleting the sign-in account,
     * changing its password) must set it.
     */
    exhaustive?: boolean;
}

type FindUserRecordsError = AdminUsersRepository.Error;

export interface IFindUserRecordsUseCase {
    /**
     * Find the user's records in every tenant (disabled tenants included).
     * Records found outside the user→tenant index are added to it.
     */
    execute(
        id: string,
        options?: FindUserRecordsOptions
    ): Promise<Result<AdminUser[], FindUserRecordsError>>;
}

/** Find every tenant's record of one user. */
export const FindUserRecordsUseCase =
    createAbstraction<IFindUserRecordsUseCase>("FindUserRecordsUseCase");

export namespace FindUserRecordsUseCase {
    export type Interface = IFindUserRecordsUseCase;
    export type Options = FindUserRecordsOptions;
    export type Error = FindUserRecordsError;
    export type Return = Promise<Result<AdminUser[], FindUserRecordsError>>;
}

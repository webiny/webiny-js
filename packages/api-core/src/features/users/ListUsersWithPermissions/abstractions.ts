import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { SecurityPermission } from "~/types/security.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";

export interface UserWithPermissions {
    user: AdminUser;
    /**
     * The permissions the user's roles grant in the current tenant, directly and through
     * the user's teams, after permission transformers ran.
     */
    permissions: SecurityPermission[];
}

type ListUsersWithPermissionsError = AdminUsersRepository.Error;

export interface IListUsersWithPermissions {
    execute(): Promise<Result<UserWithPermissions[], ListUsersWithPermissionsError>>;
}

/**
 * Lists the admin users of the current tenant, each with the permissions their roles grant.
 *
 * It does not check the caller's permissions. Its purpose is to let an application answer
 * "which users can access this record?" behind its own access check, without giving the
 * caller the `adminUsers.user` permission. Do not return its result to a client as it is.
 */
export const ListUsersWithPermissionsUseCase = createAbstraction<IListUsersWithPermissions>(
    "ListUsersWithPermissionsUseCase"
);

export namespace ListUsersWithPermissionsUseCase {
    export type Interface = IListUsersWithPermissions;
    export type Error = ListUsersWithPermissionsError;
    export type Item = UserWithPermissions;
}

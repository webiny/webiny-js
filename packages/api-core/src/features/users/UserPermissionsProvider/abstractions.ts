import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { SecurityPermission } from "~/types/security.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";

export interface UserWithPermissions {
    user: AdminUser;
    /**
     * The permissions the user's roles grant in the current tenant, directly and through
     * the user's teams, after the permission transformers and the AACL filter.
     */
    permissions: SecurityPermission[];
}

type UserPermissionsProviderError =
    | AdminUsersRepository.Error
    | RolesRepository.Error
    | TeamsRepository.Error;

export interface IUserPermissionsProvider {
    listUsersWithPermissions(): Promise<
        Result<UserWithPermissions[], UserPermissionsProviderError>
    >;
}

/**
 * Lists the admin users of the current tenant, each with the permissions their roles grant.
 *
 * It is a service, not a use case: it does not check the caller's permissions. It lets an
 * application answer "which users can access this record?" behind its own access check,
 * without giving the caller the `adminUsers.user` permission. Do not return its result to
 * a client as it is.
 */
export const UserPermissionsProvider =
    createAbstraction<IUserPermissionsProvider>("UserPermissionsProvider");

export namespace UserPermissionsProvider {
    export type Interface = IUserPermissionsProvider;
    export type Error = UserPermissionsProviderError;
    export type Item = UserWithPermissions;
}

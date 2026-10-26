import { createPermissionsAbstraction } from "~/permissions/index.js";
import type { Permissions } from "~/permissions/types.js";
import { ADMIN_USERS_PERMISSIONS_SCHEMA } from "~/features/adminUsers/permissionsSchema.js";

export const AdminUsersPermissions = createPermissionsAbstraction(ADMIN_USERS_PERMISSIONS_SCHEMA);

export namespace AdminUsersPermissions {
    export type Interface = Permissions<typeof ADMIN_USERS_PERMISSIONS_SCHEMA>;
}

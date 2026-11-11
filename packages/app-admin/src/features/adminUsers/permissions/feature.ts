import { createPermissionsFeature } from "~/permissions/index.js";
import { AdminUsersPermissions } from "./abstractions.js";
import { ADMIN_USERS_PERMISSIONS_SCHEMA } from "~/features/adminUsers/permissionsSchema.js";

export const AdminUsersPermissionsFeature = createPermissionsFeature(
    ADMIN_USERS_PERMISSIONS_SCHEMA,
    AdminUsersPermissions
);

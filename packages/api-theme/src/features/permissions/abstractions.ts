import { createPermissionsAbstraction } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";
import { THEME_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const ThemePermissions = createPermissionsAbstraction(THEME_PERMISSIONS_SCHEMA);

export namespace ThemePermissions {
    export type Interface = Permissions<typeof THEME_PERMISSIONS_SCHEMA>;
}

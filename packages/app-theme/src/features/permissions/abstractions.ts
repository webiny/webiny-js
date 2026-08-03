import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { THEME_PERMISSIONS_SCHEMA } from "~/constants.js";

export const ThemePermissions = createPermissionsAbstraction(THEME_PERMISSIONS_SCHEMA);

export namespace ThemePermissions {
    export type Interface = Permissions<typeof THEME_PERMISSIONS_SCHEMA>;
}

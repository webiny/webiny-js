import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";
import { THEME_PERMISSIONS_SCHEMA } from "~/constants.js";

export const HasPermission = createHasPermission<typeof THEME_PERMISSIONS_SCHEMA>(ThemePermissions);

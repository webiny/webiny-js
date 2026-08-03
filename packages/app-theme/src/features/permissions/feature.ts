import { createPermissionsFeature } from "@webiny/app-admin/exports/admin/security.js";
import { THEME_PERMISSIONS_SCHEMA } from "~/constants.js";
import { ThemePermissions } from "./abstractions.js";

export const ThemePermissionsFeature = createPermissionsFeature(
    THEME_PERMISSIONS_SCHEMA,
    ThemePermissions
);

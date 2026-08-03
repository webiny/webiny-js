import { createPermissionsFeature } from "@webiny/api-core/features/security/permissions/index.js";
import { THEME_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { ThemePermissions } from "./abstractions.js";

export const ThemePermissionsFeature = createPermissionsFeature(
    THEME_PERMISSIONS_SCHEMA,
    ThemePermissions
);

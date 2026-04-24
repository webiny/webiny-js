import { createPermissionsFeature } from "@webiny/api-core/features/security/permissions/index.js";
import { LANGUAGES_PERMISSIONS_SCHEMA } from "~/api/domain/permissionsSchema.js";
import { LanguagesPermissions } from "~/api/features/Permissions/abstractions.js";

export const LanguagesPermissionsFeature = createPermissionsFeature(
    LANGUAGES_PERMISSIONS_SCHEMA,
    LanguagesPermissions
);

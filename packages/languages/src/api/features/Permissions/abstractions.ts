import { createPermissionsAbstraction } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";
import { LANGUAGES_PERMISSIONS_SCHEMA } from "~/api/domain/permissionsSchema.js";

export const LanguagesPermissions = createPermissionsAbstraction(LANGUAGES_PERMISSIONS_SCHEMA);

export namespace LanguagesPermissions {
    export type Interface = Permissions<typeof LANGUAGES_PERMISSIONS_SCHEMA>;
}

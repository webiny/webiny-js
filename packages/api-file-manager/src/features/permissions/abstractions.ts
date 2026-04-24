import { createPermissionsAbstraction } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";
import { FM_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const FmPermissions = createPermissionsAbstraction(FM_PERMISSIONS_SCHEMA);

export namespace FmPermissions {
    export type Interface = Permissions<typeof FM_PERMISSIONS_SCHEMA>;
}

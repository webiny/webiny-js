import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { FM_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const FileManagerPermissions = createPermissionsAbstraction(FM_PERMISSIONS_SCHEMA);

export namespace FileManagerPermissions {
    export type Interface = Permissions<typeof FM_PERMISSIONS_SCHEMA>;
}

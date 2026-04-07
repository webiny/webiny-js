import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { SECURITY_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const SecurityPermissions = createPermissionsAbstraction(SECURITY_PERMISSIONS_SCHEMA);

export namespace SecurityPermissions {
    export type Interface = Permissions<typeof SECURITY_PERMISSIONS_SCHEMA>;
}

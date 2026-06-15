import { createPermissionsAbstraction } from "~/exports/admin/security.js";
import type { Permissions } from "~/exports/admin/security.js";
import { SECURITY_PERMISSIONS_SCHEMA } from "~/domain/securityPermissionsSchema.js";

export const SecurityPermissions = createPermissionsAbstraction(SECURITY_PERMISSIONS_SCHEMA);

export namespace SecurityPermissions {
    export type Interface = Permissions<typeof SECURITY_PERMISSIONS_SCHEMA>;
}

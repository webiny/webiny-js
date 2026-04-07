import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { CMS_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const CmsPermissions = createPermissionsAbstraction(CMS_PERMISSIONS_SCHEMA);

export namespace CmsPermissions {
    export type Interface = Permissions<typeof CMS_PERMISSIONS_SCHEMA>;
}

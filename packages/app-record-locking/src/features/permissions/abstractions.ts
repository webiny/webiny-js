import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { RECORD_LOCKING_PERMISSIONS_SCHEMA } from "~/permissions/permissionsSchema.js";

export const RecordLockingPermissions = createPermissionsAbstraction(
    RECORD_LOCKING_PERMISSIONS_SCHEMA
);

export namespace RecordLockingPermissions {
    export type Interface = Permissions<typeof RECORD_LOCKING_PERMISSIONS_SCHEMA>;
}

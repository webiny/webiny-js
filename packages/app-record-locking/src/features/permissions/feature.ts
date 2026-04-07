import { createPermissionsFeature } from "@webiny/app-admin/exports/admin/security.js";
import { RECORD_LOCKING_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { RecordLockingPermissions } from "./abstractions.js";

export const RecordLockingPermissionsFeature = createPermissionsFeature(
    RECORD_LOCKING_PERMISSIONS_SCHEMA,
    RecordLockingPermissions
);

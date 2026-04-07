import { createPermissionsFeature } from "@webiny/app-admin/exports/admin.js";
import { AL_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { AuditLogsPermissions } from "./abstractions.js";

export const AlPermissionsFeature = createPermissionsFeature(
    AL_PERMISSIONS_SCHEMA,
    AuditLogsPermissions
);

import { createPermissionsFeature } from "@webiny/api-core/exports/api/security.js";
import { ACTIVITY_LOG_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { ActivityLogPermissions } from "./abstractions.js";

export const ActivityLogPermissionsFeature = createPermissionsFeature(
    ACTIVITY_LOG_PERMISSIONS_SCHEMA,
    ActivityLogPermissions
);

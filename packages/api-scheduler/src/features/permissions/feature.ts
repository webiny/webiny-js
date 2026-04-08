import { createPermissionsFeature } from "@webiny/api-core/exports/api/security.js";
import { SCHEDULER_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { SchedulerPermissions } from "./abstractions.js";

export const SchedulerPermissionsFeature = createPermissionsFeature(
    SCHEDULER_PERMISSIONS_SCHEMA,
    SchedulerPermissions
);

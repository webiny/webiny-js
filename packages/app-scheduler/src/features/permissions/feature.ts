import { createPermissionsFeature } from "@webiny/app-admin/exports/admin/security.js";
import { SCHEDULER_PERMISSIONS_SCHEMA } from "~/permissions.js";
import { SchedulerPermissions } from "./abstractions.js";

export const SchedulerPermissionsFeature = createPermissionsFeature(
    SCHEDULER_PERMISSIONS_SCHEMA,
    SchedulerPermissions
);

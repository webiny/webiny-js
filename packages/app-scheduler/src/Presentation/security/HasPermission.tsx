import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { SchedulerPermissions } from "~/features/permissions/abstractions.js";
import { SCHEDULER_PERMISSIONS_SCHEMA } from "~/permissions.js";

export const HasPermission =
    createHasPermission<typeof SCHEDULER_PERMISSIONS_SCHEMA>(SchedulerPermissions);

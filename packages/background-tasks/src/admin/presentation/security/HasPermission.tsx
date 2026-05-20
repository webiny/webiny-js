import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { TaskPermissions } from "~/admin/features/permissions/abstractions.js";
import { BACKGROUND_TASK_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";

export const HasPermission =
    createHasPermission<typeof BACKGROUND_TASK_PERMISSIONS_SCHEMA>(TaskPermissions);

import { createPermissionsFeature } from "@webiny/app-admin/exports/admin/security.js";
import { BACKGROUND_TASK_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";
import { TaskPermissions } from "./abstractions.js";

export const TaskPermissionsFeature = createPermissionsFeature(
    BACKGROUND_TASK_PERMISSIONS_SCHEMA,
    TaskPermissions
);

import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { BACKGROUND_TASK_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";

export const TaskPermissions = createPermissionsAbstraction(BACKGROUND_TASK_PERMISSIONS_SCHEMA);

export namespace TaskPermissions {
    export type Interface = Permissions<typeof BACKGROUND_TASK_PERMISSIONS_SCHEMA>;
}

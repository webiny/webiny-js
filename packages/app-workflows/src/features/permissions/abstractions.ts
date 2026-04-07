import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin.js";
import type { Permissions } from "@webiny/app-admin/exports/admin.js";
import { WORKFLOWS_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const WorkflowsPermissions = createPermissionsAbstraction(WORKFLOWS_PERMISSIONS_SCHEMA);

export namespace WorkflowsPermissions {
    export type Interface = Permissions<typeof WORKFLOWS_PERMISSIONS_SCHEMA>;
}

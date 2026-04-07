import { createPermissionsFeature } from "@webiny/app-admin/exports/admin.js";
import { WORKFLOWS_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { WorkflowsPermissions } from "./abstractions.js";

export const WorkflowsPermissionsFeature = createPermissionsFeature(
    WORKFLOWS_PERMISSIONS_SCHEMA,
    WorkflowsPermissions
);

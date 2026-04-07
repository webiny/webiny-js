import { createPermissionsFeature } from "@webiny/app-admin/exports/admin.js";
import { SECURITY_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { SecurityPermissions } from "./abstractions.js";

export const SecurityPermissionsFeature = createPermissionsFeature(
    SECURITY_PERMISSIONS_SCHEMA,
    SecurityPermissions
);

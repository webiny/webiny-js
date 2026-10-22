import { createPermissionsFeature } from "@webiny/app-admin/exports/admin/security.js";
import { FRONTEND_PERMISSIONS_SCHEMA } from "~/admin/domain/permissionsSchema.js";
import { FrontendPermissions } from "./abstractions.js";

export const FrontendPermissionsFeature = createPermissionsFeature(
    FRONTEND_PERMISSIONS_SCHEMA,
    FrontendPermissions
);

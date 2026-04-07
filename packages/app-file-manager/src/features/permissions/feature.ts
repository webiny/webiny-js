import { createPermissionsFeature } from "@webiny/app-admin/exports/admin.js";
import { FM_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { FileManagerPermissions } from "./abstractions.js";

export const FmPermissionsFeature = createPermissionsFeature(
    FM_PERMISSIONS_SCHEMA,
    FileManagerPermissions
);

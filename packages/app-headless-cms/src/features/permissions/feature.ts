import { createPermissionsFeature } from "@webiny/app-admin/exports/admin.js";
import { CMS_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { CmsPermissions } from "./abstractions.js";

export const CmsPermissionsFeature = createPermissionsFeature(
    CMS_PERMISSIONS_SCHEMA,
    CmsPermissions
);

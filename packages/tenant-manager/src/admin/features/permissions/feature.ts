import { createPermissionsFeature } from "@webiny/app-admin/exports/admin.js";
import { TM_PERMISSIONS_SCHEMA } from "~/admin/domain/permissionsSchema.js";
import { TmPermissions } from "./abstractions.js";

export const TmPermissionsFeature = createPermissionsFeature(TM_PERMISSIONS_SCHEMA, TmPermissions);

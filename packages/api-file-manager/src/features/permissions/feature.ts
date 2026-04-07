import { createPermissionsFeature } from "@webiny/api-core/exports/api/security.js";
import { FM_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { FmPermissions } from "./abstractions.js";

export const FmPermissionsFeature = createPermissionsFeature(FM_PERMISSIONS_SCHEMA, FmPermissions);

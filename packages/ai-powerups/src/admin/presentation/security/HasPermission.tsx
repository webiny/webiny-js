import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { AiPowerUpsPermissions } from "~/admin/features/permissions/abstractions.js";
import { AI_POWERUPS_PERMISSIONS_SCHEMA } from "~/shared/permissionsSchema.js";

export const HasPermission =
    createHasPermission<typeof AI_POWERUPS_PERMISSIONS_SCHEMA>(AiPowerUpsPermissions);

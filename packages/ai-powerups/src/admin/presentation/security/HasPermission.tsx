import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { AiPowerUpsPermissions } from "~/admin/features/permissions/abstractions.js";
import { AI_POWER_UPS_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";

export const HasPermission =
    createHasPermission<typeof AI_POWER_UPS_PERMISSIONS_SCHEMA>(AiPowerUpsPermissions);

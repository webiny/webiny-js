import { createPermissionsFeature } from "@webiny/app-admin/exports/admin/security.js";
import { AI_POWER_UPS_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";
import { AiPowerUpsPermissions } from "./abstractions.js";

export const AiPowerUpsPermissionsFeature = createPermissionsFeature(
    AI_POWER_UPS_PERMISSIONS_SCHEMA,
    AiPowerUpsPermissions
);

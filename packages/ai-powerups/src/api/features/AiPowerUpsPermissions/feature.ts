import { createPermissionsFeature } from "@webiny/api-core/features/security/permissions/index.js";
import { AI_POWER_UPS_PERMISSIONS_SCHEMA } from "~/api/permissions.js";
import { AiPowerUpsPermissions } from "./abstractions.js";

export const AiPowerUpsPermissionsFeature = createPermissionsFeature(
    AI_POWER_UPS_PERMISSIONS_SCHEMA,
    AiPowerUpsPermissions
);

import { createPermissionsFeature } from "@webiny/api-core/features/security/permissions/index.js";
import { AI_POWERUPS_PERMISSIONS_SCHEMA } from "~/shared/permissionsSchema.js";
import { AiPowerUpsPermissions } from "./abstractions.js";

export const AiPowerUpsPermissionsFeature = createPermissionsFeature(
    AI_POWERUPS_PERMISSIONS_SCHEMA,
    AiPowerUpsPermissions
);

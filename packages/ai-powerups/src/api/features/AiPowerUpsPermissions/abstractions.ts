import { createPermissionsAbstraction } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";
import { AI_POWER_UPS_PERMISSIONS_SCHEMA } from "~/api/permissions.js";

export const AiPowerUpsPermissions = createPermissionsAbstraction(AI_POWER_UPS_PERMISSIONS_SCHEMA);

export namespace AiPowerUpsPermissions {
    export type Interface = Permissions<typeof AI_POWER_UPS_PERMISSIONS_SCHEMA>;
}

import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { AI_POWER_UPS_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";

export const AiPowerUpsPermissions = createPermissionsAbstraction(AI_POWER_UPS_PERMISSIONS_SCHEMA);

export namespace AiPowerUpsPermissions {
    export type Interface = Permissions<typeof AI_POWER_UPS_PERMISSIONS_SCHEMA>;
}

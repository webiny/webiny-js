import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { AI_POWERUPS_PERMISSIONS_SCHEMA } from "~/shared/permissionsSchema.js";

export const AiPowerUpsPermissions = createPermissionsAbstraction(AI_POWERUPS_PERMISSIONS_SCHEMA);

export namespace AiPowerUpsPermissions {
    export type Interface = Permissions<typeof AI_POWERUPS_PERMISSIONS_SCHEMA>;
}

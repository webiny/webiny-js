import { createPermissionsAbstraction } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";
import { AI_POWERUPS_PERMISSIONS_SCHEMA } from "~/shared/permissionsSchema.js";

export const AiPowerUpsPermissions = createPermissionsAbstraction(AI_POWERUPS_PERMISSIONS_SCHEMA);

export namespace AiPowerUpsPermissions {
    export type Interface = Permissions<typeof AI_POWERUPS_PERMISSIONS_SCHEMA>;
}

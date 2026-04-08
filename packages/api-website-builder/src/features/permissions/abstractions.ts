import { createPermissionsAbstraction } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";
import { WB_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const WbPermissions = createPermissionsAbstraction(WB_PERMISSIONS_SCHEMA);

export namespace WbPermissions {
    export type Interface = Permissions<typeof WB_PERMISSIONS_SCHEMA>;
}

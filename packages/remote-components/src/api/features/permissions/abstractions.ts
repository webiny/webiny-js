import { createPermissionsAbstraction } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";
import { RC_PERMISSIONS_SCHEMA } from "~/api/domain/permissionsSchema.js";

export const RemoteComponentPermissions = createPermissionsAbstraction(RC_PERMISSIONS_SCHEMA);

export namespace RemoteComponentPermissions {
    export type Interface = Permissions<typeof RC_PERMISSIONS_SCHEMA>;
}

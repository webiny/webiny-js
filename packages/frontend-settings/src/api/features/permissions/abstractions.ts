import { createPermissionsAbstraction } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";
import { FRONTEND_PERMISSIONS_SCHEMA } from "~/api/domain/permissionsSchema.js";

export const FrontendPermissions = createPermissionsAbstraction(FRONTEND_PERMISSIONS_SCHEMA);

export namespace FrontendPermissions {
    export type Interface = Permissions<typeof FRONTEND_PERMISSIONS_SCHEMA>;
}

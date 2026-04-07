import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin.js";
import type { Permissions } from "@webiny/app-admin/exports/admin.js";
import { COGNITO_PERMISSIONS_SCHEMA } from "~/admin/domain/permissionsSchema.js";

export const CognitoPermissions = createPermissionsAbstraction(COGNITO_PERMISSIONS_SCHEMA);

export namespace CognitoPermissions {
    export type Interface = Permissions<typeof COGNITO_PERMISSIONS_SCHEMA>;
}

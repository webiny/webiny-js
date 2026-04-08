import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { WB_PERMISSIONS_SCHEMA } from "~/constants.js";

export const WbPermissions = createPermissionsAbstraction(WB_PERMISSIONS_SCHEMA);

export namespace WbPermissions {
    export type Interface = Permissions<typeof WB_PERMISSIONS_SCHEMA>;
}

import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { WB_PERMISSIONS_SCHEMA } from "~/constants.js";

export const HasPermission = createHasPermission(WbPermissions, WB_PERMISSIONS_SCHEMA);

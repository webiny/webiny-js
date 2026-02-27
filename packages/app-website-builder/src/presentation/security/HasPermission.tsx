import { createHasPermission } from "@webiny/app-admin/exports/admin.js";
import { WB_PERMISSIONS_SCHEMA } from "~/constants.js";

export const HasPermission = createHasPermission(WB_PERMISSIONS_SCHEMA);

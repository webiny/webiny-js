import { createUsePermissions } from "@webiny/app-admin/exports/admin.js";
import { WB_PERMISSIONS_SCHEMA } from "~/constants.js";

export const usePermissions = createUsePermissions(WB_PERMISSIONS_SCHEMA);

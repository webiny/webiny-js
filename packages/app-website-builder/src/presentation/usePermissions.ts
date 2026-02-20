import { usePermissions as usePermissionsFactory } from "@webiny/app-admin/exports/admin.js";
import { WB_PERMISSIONS_SCHEMA } from "~/constants.js";

export const usePermissions = () => {
    return usePermissionsFactory(WB_PERMISSIONS_SCHEMA);
};

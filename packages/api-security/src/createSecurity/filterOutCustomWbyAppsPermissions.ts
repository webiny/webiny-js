import { SecurityPermission } from "~/types";

const WBY_APPS_PERMISSIONS_PREFIXES = ["pb", "fb", "fm", "cms", "security", "adminUsers", "i18n"];

export const filterOutCustomWbyAppsPermissions = (permissions: SecurityPermission[]) => {
    return permissions.filter(permission => {
        // Just in case, if the `name` property is missing, we don't omit the permission.
        if (!permission.name) {
            return true;
        }

        let isWbyAppPermission = false,
            wbyAppPermissionPrefix = "";
        for (let i = 0; i < WBY_APPS_PERMISSIONS_PREFIXES.length; i++) {
            const prefix = WBY_APPS_PERMISSIONS_PREFIXES[i];
            if (permission.name.startsWith(`${prefix}.`)) {
                isWbyAppPermission = true;
                wbyAppPermissionPrefix = prefix;
                break;
            }
        }

        // Not a Webiny app permission? Then don't omit the permission.
        if (!isWbyAppPermission) {
            return true;
        }

        // Only allow full access (`${wbyAppPermissionPrefix}.*`) permissions.
        return permission.name === `${wbyAppPermissionPrefix}.*`;
    });
};

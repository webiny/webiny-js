import { WcpProjectEnvironment } from "@webiny/wcp/types";
import { decrypt } from "@webiny/wcp";
import { SecurityPermission } from "@webiny/api-security/types";

export function getWcpProjectEnvironment(): WcpProjectEnvironment | null {
    if (process.env.WCP_PROJECT_ENVIRONMENT) {
        try {
            return decrypt<WcpProjectEnvironment>(process.env.WCP_PROJECT_ENVIRONMENT);
        } catch {
            throw new Error("Could not decrypt WCP_PROJECT_ENVIRONMENT environment variable data.");
        }
    }
    return null;
}

export const getWcpProjectLicenseCacheKey = () => {
    // We're dividing an hour into 5-minute blocks. In an hour, that's 12 blocks total.
    // So, while we're in the same 5-minute block, the cached license will be returned.
    // Once we exit it, the license will again be fetched from the WCP API.
    // This way of caching / invalidating the cache ensures all active AWS Lambda function
    // instances flush their cache and fetch the license at the same time.
    const currentHourOfTheDay = new Date().getHours();
    const currentMinuteOfTheHour = new Date().getMinutes();

    // Example returned values:
    // - "cached-license-16-2"
    // - "cached-license-0-1"
    // - "cached-license-23-12"
    return `cached-project-license-${currentHourOfTheDay}-${Math.ceil(currentMinuteOfTheHour / 5)}`;
};

const WBY_APPS_PERMISSIONS_PREFIXES = ["pb", "fb", "cms", "security", "adminUsers", "i18n"];

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

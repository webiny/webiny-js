import { getWcpProjectLicense, getWcpAppUrl, getWcpApiUrl, WCP_FEATURE_LABEL } from "@webiny/wcp";
import WError from "@webiny/error";
import { WcpContextObject, CachedWcpProjectLicense } from "./types";
import { getWcpProjectLicenseCacheKey, getWcpProjectEnvironment, wcpFetch } from "./utils";
import { DecryptedWcpProjectLicense } from "@webiny/wcp/types";

const wcpProjectEnvironment = getWcpProjectEnvironment();

const cachedWcpProjectLicense: CachedWcpProjectLicense = {
    cacheKey: null,
    license: null
};

export interface WcpFetchParams {
    url: string;
    authorization: string;
    body: Record<string, any>;
    meta: Record<string, any>;
}

export interface CreateWcpParams {
    testProjectLicense?: DecryptedWcpProjectLicense;
}

export const createWcp = async (params: CreateWcpParams = {}): Promise<WcpContextObject> => {
    if (params.testProjectLicense) {
        cachedWcpProjectLicense.license = params.testProjectLicense;
    } else if (wcpProjectEnvironment) {
        const currentCacheKey = getWcpProjectLicenseCacheKey();
        if (cachedWcpProjectLicense.cacheKey !== currentCacheKey) {
            cachedWcpProjectLicense.cacheKey = currentCacheKey;
            // Will pull the project license from the WCP API.
            cachedWcpProjectLicense.license = await getWcpProjectLicense({
                orgId: wcpProjectEnvironment.org.id,
                projectId: wcpProjectEnvironment.project.id,
                projectEnvironmentApiKey: wcpProjectEnvironment.apiKey
            });
        }
    }

    // Returns the dedicated Webiny Control Panel (WCP) REST API URL for given org and project.
    const getWcpProjectUrl = (path = "") => {
        if (!wcpProjectEnvironment) {
            return null;
        }

        const orgId = wcpProjectEnvironment.org.id;
        const projectId = wcpProjectEnvironment.project.id;
        const url = ["/orgs", orgId, "projects", projectId, path].filter(Boolean).join("/");
        return getWcpApiUrl(url);
    };

    const updateSeats = async (operation: "increment" | "decrement"): Promise<void> => {
        if (!wcpProjectEnvironment) {
            return;
        }

        const updateSeatsUrl = getWcpProjectUrl("package/seats");

        const response = await wcpFetch({
            url: updateSeatsUrl!,
            authorization: wcpProjectEnvironment.apiKey,
            body: { operation },
            meta: {
                action: operation + "Seats"
            }
        });

        if (response.error) {
            const message = response.message || `Failed to ${operation} user seats.`;
            console.error(message, response.status, response.statusText);
            throw new WError(message, "WCP_CANNOT_UPDATE_USER_TENANTS");
        }
    };

    const updateTenants = async (operation: "increment" | "decrement") => {
        if (!wcpProjectEnvironment) {
            return;
        }

        const updateTenantsUrl = getWcpProjectUrl("package/tenants");

        const response = await wcpFetch({
            url: updateTenantsUrl!,
            authorization: wcpProjectEnvironment.apiKey,
            body: { operation },
            meta: {
                action: operation + "Tenants"
            }
        });

        if (response.error) {
            const message = response.message || `Failed to ${operation} tenants.`;
            console.error(message, response.status, response.statusText);
            throw new WError(message, "WCP_CANNOT_UPDATE_USER_TENANTS");
        }
    };

    return {
        getProjectEnvironment: () => {
            return wcpProjectEnvironment;
        },

        getProjectLicense: () => {
            return cachedWcpProjectLicense.license;
        },

        canUseFeature(wcpFeatureId: keyof typeof WCP_FEATURE_LABEL) {
            const projectLicense = this.getProjectLicense();

            // For backwards compatibility, we need to check the legacy ENV variable `WEBINY_MULTI_TENANCY`.
            if (!projectLicense && wcpFeatureId === "multiTenancy") {
                return process.env.WEBINY_MULTI_TENANCY === "true";
            }
            return projectLicense?.package?.features?.[wcpFeatureId]?.enabled === true;
        },

        canUseAacl() {
            return this.canUseFeature("advancedAccessControlLayer");
        },

        canUseTeams() {
            if (!this.canUseAacl()) {
                return false;
            }

            const license = this.getProjectLicense();
            return license!.package.features.advancedAccessControlLayer.options.teams;
        },

        canUseFolderLevelPermissions() {
            if (!this.canUseAacl()) {
                return false;
            }

            const license = this.getProjectLicense();
            return license!.package.features.advancedAccessControlLayer.options
                .folderLevelPermissions;
        },

        canUsePrivateFiles() {
            if (!this.canUseAacl()) {
                return false;
            }

            const license = this.getProjectLicense();
            return license!.package.features.advancedAccessControlLayer.options.privateFiles;
        },

        ensureCanUseFeature(wcpFeatureId: keyof typeof WCP_FEATURE_LABEL) {
            if (this.canUseFeature(wcpFeatureId)) {
                return;
            }

            let message = `The ${wcpFeatureId} Webiny Control Panel feature cannot be used because your project license does not permit it.`;
            if (wcpProjectEnvironment) {
                const { org, project } = wcpProjectEnvironment;
                const upgradeProjectLicenseLink = getWcpAppUrl(`/${org.id}/${project.id}/settings`);
                message += `To upgrade your project license, please use the following link: ${upgradeProjectLicenseLink}.`;
            }

            throw new WError(message, "WCP_CANNOT_USE_FEATURE", { wcpFeatureId });
        },

        async incrementSeats() {
            await updateSeats("increment");
        },

        async decrementSeats() {
            await updateSeats("decrement");
        },

        async incrementTenants() {
            await updateTenants("increment");
        },

        async decrementTenants() {
            await updateTenants("decrement");
        }
    } as WcpContextObject;
};

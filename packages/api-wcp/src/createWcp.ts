import type { WCP_FEATURE_LABEL } from "@webiny/wcp";
import {
    getWcpApiUrl,
    getWcpAppUrl,
    getWcpProjectEnvironment,
    getWcpProjectLicense,
    License,
    NullLicense
} from "@webiny/wcp";
import WError from "@webiny/error";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import type { CachedWcpProjectLicense, WcpContextObject } from "./types.js";
import { getWcpProjectLicenseCacheKey, wcpFetch } from "./utils.js";

const wcpProjectEnvironment = getWcpProjectEnvironment();

const cachedWcpProjectLicense: CachedWcpProjectLicense = {
    cacheKey: null,
    project: null,
    license: new NullLicense()
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
        cachedWcpProjectLicense.license = License.fromLicenseDto(params.testProjectLicense);
    } else if (wcpProjectEnvironment) {
        const currentCacheKey = getWcpProjectLicenseCacheKey();
        if (cachedWcpProjectLicense.cacheKey !== currentCacheKey) {
            cachedWcpProjectLicense.cacheKey = currentCacheKey;
            // Pull the project license from the WCP API.
            const decryptedLicenseDto = await getWcpProjectLicense({
                orgId: wcpProjectEnvironment.org.id,
                projectId: wcpProjectEnvironment.project.id,
                projectEnvironmentApiKey: wcpProjectEnvironment.apiKey
            });

            if (decryptedLicenseDto) {
                cachedWcpProjectLicense.project = {
                    orgId: decryptedLicenseDto.orgId,
                    projectId: decryptedLicenseDto.projectId,
                    package: decryptedLicenseDto.package
                };
            }

            cachedWcpProjectLicense.license = License.fromLicenseDto(decryptedLicenseDto);
        }
    } else if (process.env.WCP_PROJECT_LICENSE) {
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
        getRawLicense: () => {
            return cachedWcpProjectLicense.license.getRawLicense();
        },
        getProject: () => {
            return cachedWcpProjectLicense.project;
        },

        getProjectEnvironment: () => {
            return wcpProjectEnvironment;
        },

        getProjectLicense: () => {
            return cachedWcpProjectLicense.license;
        },

        canUseFeature(wcpFeatureId: keyof typeof WCP_FEATURE_LABEL) {
            return cachedWcpProjectLicense.license.canUseFeature(wcpFeatureId);
        },

        canUseAacl() {
            return cachedWcpProjectLicense.license.canUseAacl();
        },

        canUseTeams() {
            return cachedWcpProjectLicense.license.canUseTeams();
        },

        canUseFolderLevelPermissions() {
            return cachedWcpProjectLicense.license.canUseFolderLevelPermissions();
        },

        canUsePrivateFiles() {
            return cachedWcpProjectLicense.license.canUsePrivateFiles();
        },

        canUseAuditLogs() {
            return cachedWcpProjectLicense.license.canUseAuditLogs();
        },

        canUseRecordLocking() {
            return cachedWcpProjectLicense.license.canUseRecordLocking();
        },

        canUseFileManagerThreatDetection() {
            return cachedWcpProjectLicense.license.canUseFileManagerThreatDetection();
        },

        canUseWorkflows(): boolean {
            return cachedWcpProjectLicense.license.canUseWorkflows();
        },

        ensureCanUseFeature(wcpFeatureId: keyof typeof WCP_FEATURE_LABEL) {
            if (cachedWcpProjectLicense.license.canUseFeature(wcpFeatureId)) {
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
    };
};

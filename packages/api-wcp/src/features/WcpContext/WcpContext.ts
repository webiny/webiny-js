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
import type {
    DecryptedWcpProjectLicense,
    ILicense,
    WcpProjectEnvironment
} from "@webiny/wcp/types.js";
import type { CachedWcpProjectLicense, WcpProject } from "~/types.js";
import { getWcpProjectLicenseCacheKey, wcpFetch } from "~/utils.js";
import { WcpContext } from "./abstractions";

const wcpProjectEnvironment = getWcpProjectEnvironment();

const cachedWcpProjectLicense: CachedWcpProjectLicense = {
    cacheKey: null,
    project: null,
    license: new NullLicense()
};

export interface CreateWcpContextParams {
    testProjectLicense?: DecryptedWcpProjectLicense;
}

export class WcpContextImpl implements WcpContext.Interface {
    private initialized = false;

    constructor(private params: CreateWcpContextParams = {}) {}

    private async ensureInitialized(): Promise<void> {
        if (this.initialized) {
            return;
        }

        if (this.params.testProjectLicense) {
            cachedWcpProjectLicense.license = License.fromLicenseDto(
                this.params.testProjectLicense
            );
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
        }

        this.initialized = true;
    }

    private getWcpProjectUrl(path = ""): string | null {
        if (!wcpProjectEnvironment) {
            return null;
        }

        const orgId = wcpProjectEnvironment.org.id;
        const projectId = wcpProjectEnvironment.project.id;
        const url = ["/orgs", orgId, "projects", projectId, path].filter(Boolean).join("/");
        return getWcpApiUrl(url);
    }

    private async updateSeats(operation: "increment" | "decrement"): Promise<void> {
        if (!wcpProjectEnvironment) {
            return;
        }

        const updateSeatsUrl = this.getWcpProjectUrl("package/seats");

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
    }

    private async updateTenants(operation: "increment" | "decrement"): Promise<void> {
        if (!wcpProjectEnvironment) {
            return;
        }

        const updateTenantsUrl = this.getWcpProjectUrl("package/tenants");

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
    }

    getRawLicense(): DecryptedWcpProjectLicense | null {
        return cachedWcpProjectLicense.license.getRawLicense();
    }

    getProject(): WcpProject | null {
        return cachedWcpProjectLicense.project;
    }

    getProjectEnvironment(): WcpProjectEnvironment | null {
        return wcpProjectEnvironment;
    }

    getProjectLicense(): ILicense {
        return cachedWcpProjectLicense.license;
    }

    canUseFeature(wcpFeatureId: keyof typeof WCP_FEATURE_LABEL): boolean {
        return cachedWcpProjectLicense.license.canUseFeature(wcpFeatureId);
    }

    canUseAacl(): boolean {
        return cachedWcpProjectLicense.license.canUseAacl();
    }

    canUseTeams(): boolean {
        return cachedWcpProjectLicense.license.canUseTeams();
    }

    canUseFolderLevelPermissions(): boolean {
        return cachedWcpProjectLicense.license.canUseFolderLevelPermissions();
    }

    canUsePrivateFiles(): boolean {
        return cachedWcpProjectLicense.license.canUsePrivateFiles();
    }

    canUseAuditLogs(): boolean {
        return cachedWcpProjectLicense.license.canUseAuditLogs();
    }

    canUseRecordLocking(): boolean {
        return cachedWcpProjectLicense.license.canUseRecordLocking();
    }

    canUseFileManagerThreatDetection(): boolean {
        return cachedWcpProjectLicense.license.canUseFileManagerThreatDetection();
    }

    canUseWorkflows(): boolean {
        return cachedWcpProjectLicense.license.canUseWorkflows();
    }

    ensureCanUseFeature(wcpFeatureId: keyof typeof WCP_FEATURE_LABEL): void {
        if (cachedWcpProjectLicense.license.canUseFeature(wcpFeatureId)) {
            return;
        }

        let message = `The ${wcpFeatureId} Webiny Control Panel feature cannot be used because your project license does not permit it.`;
        if (wcpProjectEnvironment) {
            const { org, project } = wcpProjectEnvironment;
            const upgradeProjectLicenseLink = getWcpAppUrl(`/${org.id}/${project.id}/settings`);
            message += ` To upgrade your project license, please use the following link: ${upgradeProjectLicenseLink}.`;
        }

        throw new WError(message, "WCP_CANNOT_USE_FEATURE", { wcpFeatureId });
    }

    async incrementSeats(): Promise<void> {
        await this.ensureInitialized();
        await this.updateSeats("increment");
    }

    async decrementSeats(): Promise<void> {
        await this.ensureInitialized();
        await this.updateSeats("decrement");
    }

    async incrementTenants(): Promise<void> {
        await this.ensureInitialized();
        await this.updateTenants("increment");
    }

    async decrementTenants(): Promise<void> {
        await this.ensureInitialized();
        await this.updateTenants("decrement");
    }
}

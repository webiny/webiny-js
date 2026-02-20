import type { WCP_FEATURE_LABEL } from "@webiny/wcp";
import { getWcpApiUrl, getWcpAppUrl, getWcpProjectEnvironment } from "@webiny/wcp";
import WError from "@webiny/error";
import type {
    DecryptedWcpProjectLicense,
    ILicense,
    WcpProjectEnvironment,
    WcpProject
} from "@webiny/wcp/types.js";
import { WcpContext } from "./abstractions.js";
import { wcpFetch } from "./utils.js";
import type { IBuildParams } from "../../buildParams/abstractions.js";

const wcpProjectEnvironment = getWcpProjectEnvironment();

export interface CreateWcpContextParams {
    testProjectLicense?: DecryptedWcpProjectLicense;
}

export class WcpContextImpl implements WcpContext.Interface {
    constructor(
        private license: ILicense,
        private buildParams?: IBuildParams
    ) {}

    private isFeatureEnabled(featureName: string): boolean {
        if (!this.buildParams) {
            return true;
        }
        const value = this.buildParams.get<boolean>(`wcp.feature.${featureName}`);
        return value !== false;
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
        return this.license.getRawLicense();
    }

    getProject(): WcpProject | null {
        return this.license.getProject();
    }

    getProjectEnvironment(): WcpProjectEnvironment | null {
        return wcpProjectEnvironment;
    }

    getProjectLicense(): ILicense {
        return this.license;
    }

    canUseFeature(wcpFeatureId: keyof typeof WCP_FEATURE_LABEL): boolean {
        return this.license.canUseFeature(wcpFeatureId);
    }

    canUseAacl(): boolean {
        return this.license.canUseAacl() && this.isFeatureEnabled("aacl");
    }

    canUseTeams(): boolean {
        return this.license.canUseTeams() && this.isFeatureEnabled("teams");
    }

    canUseFolderLevelPermissions(): boolean {
        return (
            this.license.canUseFolderLevelPermissions() &&
            this.isFeatureEnabled("folderLevelPermissions")
        );
    }

    canUsePrivateFiles(): boolean {
        return this.license.canUsePrivateFiles() && this.isFeatureEnabled("privateFiles");
    }

    canUseAuditLogs(): boolean {
        return this.license.canUseAuditLogs() && this.isFeatureEnabled("auditLogs");
    }

    canUseRecordLocking(): boolean {
        return this.license.canUseRecordLocking() && this.isFeatureEnabled("recordLocking");
    }

    canUseFileManagerThreatDetection(): boolean {
        return (
            this.license.canUseFileManagerThreatDetection() &&
            this.isFeatureEnabled("fileManagerThreatDetection")
        );
    }

    canUseWorkflows(): boolean {
        return this.license.canUseWorkflows() && this.isFeatureEnabled("workflows");
    }

    ensureCanUseFeature(wcpFeatureId: keyof typeof WCP_FEATURE_LABEL): void {
        if (this.license.canUseFeature(wcpFeatureId)) {
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
        await this.updateSeats("increment");
    }

    async decrementSeats(): Promise<void> {
        await this.updateSeats("decrement");
    }

    async incrementTenants(): Promise<void> {
        await this.updateTenants("increment");
    }

    async decrementTenants(): Promise<void> {
        await this.updateTenants("decrement");
    }

    toDto() {
        return this.getRawLicense();
    }
}

import { Container } from "@webiny/di";
import type { WCP_FEATURE_LABEL } from "@webiny/wcp";
import type {
    DecryptedWcpProjectLicense,
    ILicense,
    WcpProject,
    WcpProjectEnvironment
} from "@webiny/wcp/types.js";
import { WcpContextObject } from "~/features/wcp/WcpContext/types.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";

export class LegacyWcpContext implements WcpContextObject {
    constructor(private container: Container) {}

    private getWcpContext(): WcpContext.Interface {
        return this.container.resolve(WcpContext);
    }

    getRawLicense(): DecryptedWcpProjectLicense | null {
        return this.getWcpContext().getRawLicense();
    }

    getProject(): WcpProject | null {
        return this.getWcpContext().getProject();
    }

    getProjectLicense(): ILicense {
        return this.getWcpContext().getProjectLicense();
    }

    getProjectEnvironment(): WcpProjectEnvironment | null {
        return this.getWcpContext().getProjectEnvironment();
    }

    canUseFeature(wcpFeatureId: keyof typeof WCP_FEATURE_LABEL): boolean {
        return this.getWcpContext().canUseFeature(wcpFeatureId);
    }

    canUseAacl(): boolean {
        return this.getWcpContext().canUseAacl();
    }

    canUseTeams(): boolean {
        return this.getWcpContext().canUseTeams();
    }

    canUseFolderLevelPermissions(): boolean {
        return this.getWcpContext().canUseFolderLevelPermissions();
    }

    canUsePrivateFiles(): boolean {
        return this.getWcpContext().canUsePrivateFiles();
    }

    canUseAuditLogs(): boolean {
        return this.getWcpContext().canUseAuditLogs();
    }

    canUseRecordLocking(): boolean {
        return this.getWcpContext().canUseRecordLocking();
    }

    canUseFileManagerThreatDetection(): boolean {
        return this.getWcpContext().canUseFileManagerThreatDetection();
    }

    canUseWorkflows(): boolean {
        return this.getWcpContext().canUseWorkflows();
    }

    ensureCanUseFeature(featureId: keyof typeof WCP_FEATURE_LABEL): void {
        this.getWcpContext().ensureCanUseFeature(featureId);
    }

    async incrementSeats(): Promise<void> {
        await this.getWcpContext().incrementSeats();
    }

    async decrementSeats(): Promise<void> {
        await this.getWcpContext().decrementSeats();
    }

    async incrementTenants(): Promise<void> {
        await this.getWcpContext().incrementTenants();
    }

    async decrementTenants(): Promise<void> {
        await this.getWcpContext().decrementTenants();
    }
}

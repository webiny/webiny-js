import type { DecryptedWcpProjectLicense, ILicense, WcpProject } from "@webiny/wcp/types.js";
import type { WCP_FEATURE_LABEL } from "@webiny/wcp";
import { NullLicense } from "@webiny/wcp";

export class ReactLicense implements ILicense {
    private readonly license: ILicense;

    constructor(license: ILicense) {
        this.license = license;
    }

    getProject(): WcpProject | null {
        return this.license.getProject();
    }

    canUseAacl(): boolean {
        return this.license.canUseAacl();
    }

    canUseAuditLogs(): boolean {
        return this.license.canUseAuditLogs();
    }

    canUseFeature(featureId: keyof typeof WCP_FEATURE_LABEL): boolean {
        // For backwards compatibility with projects created prior to 5.29.0 release.
        if (this.license instanceof NullLicense && featureId === "multiTenancy") {
            return process.env.REACT_APP_WEBINY_MULTI_TENANCY === "true";
        }

        return this.license.canUseFeature(featureId);
    }

    canUseFileManagerThreatDetection(): boolean {
        return this.license.canUseFileManagerThreatDetection();
    }

    canUseFolderLevelPermissions(): boolean {
        return this.license.canUseFolderLevelPermissions();
    }

    canUsePrivateFiles(): boolean {
        return this.license.canUsePrivateFiles();
    }

    canUseRecordLocking(): boolean {
        return this.license.canUseRecordLocking();
    }

    canUseTeams(): boolean {
        return this.license.canUseTeams();
    }

    getRawLicense(): DecryptedWcpProjectLicense | null {
        return this.license.getRawLicense();
    }

    public canUseWorkflows(): boolean {
        return this.license.canUseWorkflows();
    }
}

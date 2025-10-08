import type { WCP_FEATURE_LABEL } from "~/index.js";
import type { ILicense, WcpProject } from "~/types.js";

export class NullLicense implements ILicense {
    getRawLicense() {
        return null;
    }

    getProject(): WcpProject | null {
        return null;
    }

    canUseAacl() {
        return false;
    }

    canUseAuditLogs() {
        return false;
    }

    canUseFeature(featureId: keyof typeof WCP_FEATURE_LABEL): boolean {
        // For backwards compatibility, we need to check the legacy ENV variable `WEBINY_MULTI_TENANCY`.
        if (featureId === "multiTenancy") {
            return process.env.WEBINY_MULTI_TENANCY === "true";
        }

        return false;
    }

    canUseFileManagerThreatDetection() {
        return false;
    }

    canUseFolderLevelPermissions() {
        return false;
    }

    canUsePrivateFiles() {
        return false;
    }

    canUseRecordLocking() {
        return false;
    }

    canUseTeams() {
        return false;
    }

    public canUseWorkflows(): boolean {
        return false;
    }
}

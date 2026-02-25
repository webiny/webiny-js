import type { WCP_FEATURE_LABEL } from "@webiny/wcp";
import { WcpContext } from "../abstractions.js";
import { FeatureFlags } from "../../../featureFlags/abstractions.js";

class WcpContextWithFeatureFlagsDecoratorImpl implements WcpContext.Interface {
    constructor(
        private featureFlags: FeatureFlags.Interface,
        private decoratee: WcpContext.Interface
    ) {}

    getRawLicense() {
        return this.decoratee.getRawLicense();
    }

    getProject() {
        return this.decoratee.getProject();
    }

    getProjectEnvironment() {
        return this.decoratee.getProjectEnvironment();
    }

    getProjectLicense() {
        return this.decoratee.getProjectLicense();
    }

    canUseFeature(wcpFeatureId: keyof typeof WCP_FEATURE_LABEL) {
        return this.decoratee.canUseFeature(wcpFeatureId);
    }

    canUseAacl() {
        const wcp = this.featureFlags.get().wcp;
        return this.decoratee.canUseAacl() && wcp?.advancedAccessControlLayer?.enabled !== false;
    }

    canUseTeams() {
        const wcp = this.featureFlags.get().wcp;
        return (
            this.decoratee.canUseTeams() &&
            wcp?.advancedAccessControlLayer?.options?.teams !== false
        );
    }

    canUseFolderLevelPermissions() {
        const wcp = this.featureFlags.get().wcp;
        return (
            this.decoratee.canUseFolderLevelPermissions() &&
            wcp?.advancedAccessControlLayer?.options?.folderLevelPermissions !== false
        );
    }

    canUsePrivateFiles() {
        const wcp = this.featureFlags.get().wcp;
        return (
            this.decoratee.canUsePrivateFiles() &&
            wcp?.advancedAccessControlLayer?.options?.privateFiles !== false
        );
    }

    canUseAuditLogs() {
        const wcp = this.featureFlags.get().wcp;
        return this.decoratee.canUseAuditLogs() && wcp?.auditLogs?.enabled !== false;
    }

    canUseRecordLocking() {
        const wcp = this.featureFlags.get().wcp;
        return this.decoratee.canUseRecordLocking() && wcp?.recordLocking?.enabled !== false;
    }

    canUseFileManagerThreatDetection() {
        const wcp = this.featureFlags.get().wcp;
        return (
            this.decoratee.canUseFileManagerThreatDetection() &&
            wcp?.fileManager?.options?.threatDetection !== false
        );
    }

    canUseWorkflows() {
        const wcp = this.featureFlags.get().wcp;
        return (
            this.decoratee.canUseWorkflows() && wcp?.advancedPublishingWorkflow?.enabled !== false
        );
    }

    ensureCanUseFeature(featureId: keyof typeof WCP_FEATURE_LABEL) {
        return this.decoratee.ensureCanUseFeature(featureId);
    }

    async incrementSeats() {
        return this.decoratee.incrementSeats();
    }

    async decrementSeats() {
        return this.decoratee.decrementSeats();
    }

    async incrementTenants() {
        return this.decoratee.incrementTenants();
    }

    async decrementTenants() {
        return this.decoratee.decrementTenants();
    }

    toDto() {
        return this.decoratee.toDto();
    }
}

export const WcpContextWithFeatureFlagsDecorator = WcpContext.createDecorator({
    decorator: WcpContextWithFeatureFlagsDecoratorImpl,
    dependencies: [FeatureFlags]
});

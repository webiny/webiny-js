import type { WCP_FEATURE_LABEL } from "@webiny/wcp";
import { WcpContext } from "../abstractions.js";
import { FeatureFlags } from "../../WcpFeatureFlags/abstractions.js";

class WcpContextWithFeatureFlagsDecoratorImpl implements WcpContext.Interface {
    constructor(
        private overrides: FeatureFlags.Interface,
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
        return this.decoratee.canUseAacl() && this.overrides.isEnabled("aacl");
    }

    canUseTeams() {
        return this.decoratee.canUseTeams() && this.overrides.isEnabled("teams");
    }

    canUseFolderLevelPermissions() {
        return (
            this.decoratee.canUseFolderLevelPermissions() &&
            this.overrides.isEnabled("folderLevelPermissions")
        );
    }

    canUsePrivateFiles() {
        return this.decoratee.canUsePrivateFiles() && this.overrides.isEnabled("privateFiles");
    }

    canUseAuditLogs() {
        return this.decoratee.canUseAuditLogs() && this.overrides.isEnabled("auditLogs");
    }

    canUseRecordLocking() {
        return this.decoratee.canUseRecordLocking() && this.overrides.isEnabled("recordLocking");
    }

    canUseFileManagerThreatDetection() {
        return (
            this.decoratee.canUseFileManagerThreatDetection() &&
            this.overrides.isEnabled("fileManagerThreatDetection")
        );
    }

    canUseWorkflows() {
        return this.decoratee.canUseWorkflows() && this.overrides.isEnabled("workflows");
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

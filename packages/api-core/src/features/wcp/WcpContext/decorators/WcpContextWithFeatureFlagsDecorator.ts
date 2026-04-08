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

    getProjectWithFeatureFlags() {
        const project = this.decoratee.getProjectWithFeatureFlags();
        if (!project) {
            return null;
        }

        const flags = this.featureFlags.get();

        return {
            ...project,
            package: {
                ...project.package,
                features: {
                    ...project.package.features,
                    multiTenancy: project.package.features.multiTenancy,
                    advancedPublishingWorkflow: {
                        ...project.package.features.advancedPublishingWorkflow,
                        enabled: flags.isWorkflowsEnabled()
                            ? project.package.features.advancedPublishingWorkflow.enabled
                            : false
                    },
                    advancedAccessControlLayer: {
                        ...project.package.features.advancedAccessControlLayer,
                        enabled: flags.isAaclEnabled()
                            ? project.package.features.advancedAccessControlLayer.enabled
                            : false,
                        options: {
                            teams: flags.isTeamsEnabled()
                                ? project.package.features.advancedAccessControlLayer.options.teams
                                : false,
                            privateFiles: flags.isPrivateFilesEnabled()
                                ? project.package.features.advancedAccessControlLayer.options
                                      .privateFiles
                                : false,
                            folderLevelPermissions: flags.isFolderLevelPermissionsEnabled()
                                ? project.package.features.advancedAccessControlLayer.options
                                      .folderLevelPermissions
                                : false,
                            hcmsFieldPermissions: flags.isHcmsFieldPermissionsEnabled()
                                ? project.package.features.advancedAccessControlLayer.options
                                      .hcmsFieldPermissions
                                : false
                        }
                    },
                    auditLogs: {
                        ...project.package.features.auditLogs,
                        enabled: flags.isAuditLogsEnabled()
                            ? project.package.features.auditLogs.enabled
                            : false
                    },
                    recordLocking: {
                        ...project.package.features.recordLocking,
                        enabled: flags.isRecordLockingEnabled()
                            ? project.package.features.recordLocking.enabled
                            : false
                    },
                    fileManager: {
                        ...project.package.features.fileManager,
                        enabled: project.package.features.fileManager.enabled,
                        options: {
                            threatDetection: flags.isFileManagerThreatDetectionEnabled()
                                ? project.package.features.fileManager.options.threatDetection
                                : false
                        }
                    }
                }
            }
        };
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
        return this.decoratee.canUseAacl() && this.featureFlags.get().isAaclEnabled();
    }

    canUseTeams() {
        return this.decoratee.canUseTeams() && this.featureFlags.get().isTeamsEnabled();
    }

    canUseFolderLevelPermissions() {
        return (
            this.decoratee.canUseFolderLevelPermissions() &&
            this.featureFlags.get().isFolderLevelPermissionsEnabled()
        );
    }

    canUsePrivateFiles() {
        return (
            this.decoratee.canUsePrivateFiles() && this.featureFlags.get().isPrivateFilesEnabled()
        );
    }

    canUseAuditLogs() {
        return this.decoratee.canUseAuditLogs() && this.featureFlags.get().isAuditLogsEnabled();
    }

    canUseRecordLocking() {
        return (
            this.decoratee.canUseRecordLocking() && this.featureFlags.get().isRecordLockingEnabled()
        );
    }

    canUseFileManagerThreatDetection() {
        return (
            this.decoratee.canUseFileManagerThreatDetection() &&
            this.featureFlags.get().isFileManagerThreatDetectionEnabled()
        );
    }

    canUseWorkflows() {
        return this.decoratee.canUseWorkflows() && this.featureFlags.get().isWorkflowsEnabled();
    }

    canUseHcmsFieldPermissions() {
        return (
            this.decoratee.canUseHcmsFieldPermissions() &&
            this.featureFlags.get().isHcmsFieldPermissionsEnabled()
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

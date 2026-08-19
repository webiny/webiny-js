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
                        enabled: flags.isEnabled("advancedPublishingWorkflow")
                            ? project.package.features.advancedPublishingWorkflow.enabled
                            : false
                    },
                    advancedAccessControlLayer: {
                        ...project.package.features.advancedAccessControlLayer,
                        enabled: flags.isEnabled("advancedAccessControlLayer")
                            ? project.package.features.advancedAccessControlLayer.enabled
                            : false,
                        options: {
                            teams: flags.isEnabled("advancedAccessControlLayer.teams")
                                ? project.package.features.advancedAccessControlLayer.options.teams
                                : false,
                            privateFiles: flags.isEnabled("advancedAccessControlLayer.privateFiles")
                                ? project.package.features.advancedAccessControlLayer.options
                                      .privateFiles
                                : false,
                            folderLevelPermissions: flags.isEnabled(
                                "advancedAccessControlLayer.folderLevelPermissions"
                            )
                                ? project.package.features.advancedAccessControlLayer.options
                                      .folderLevelPermissions
                                : false,
                            hcmsFieldPermissions: flags.isEnabled(
                                "advancedAccessControlLayer.hcmsFieldPermissions"
                            )
                                ? project.package.features.advancedAccessControlLayer.options
                                      .hcmsFieldPermissions
                                : false
                        }
                    },
                    auditLogs: {
                        ...project.package.features.auditLogs,
                        enabled: flags.isEnabled("auditLogs")
                            ? project.package.features.auditLogs.enabled
                            : false
                    },
                    recordLocking: {
                        ...project.package.features.recordLocking,
                        enabled: flags.isEnabled("recordLocking")
                            ? project.package.features.recordLocking.enabled
                            : false
                    },
                    fileManager: {
                        ...project.package.features.fileManager,
                        enabled: project.package.features.fileManager.enabled,
                        options: {
                            threatDetection: flags.isEnabled("fileManager.threatDetection")
                                ? project.package.features.fileManager.options.threatDetection
                                : false
                        }
                    },
                    aiPowerups: {
                        ...project.package.features.aiPowerups,
                        enabled: flags.isEnabled("aiPowerups")
                            ? project.package.features.aiPowerups?.enabled
                            : false,
                        options: {
                            websiteBuilder: {
                                pageGeneration: flags.isEnabled(
                                    "aiPowerups.websiteBuilder.pageGeneration"
                                )
                                    ? project.package.features.aiPowerups?.options?.websiteBuilder
                                          ?.pageGeneration
                                    : false,
                                pageTranslation: flags.isEnabled(
                                    "aiPowerups.websiteBuilder.pageTranslation"
                                )
                                    ? project.package.features.aiPowerups?.options?.websiteBuilder
                                          ?.pageTranslation
                                    : false
                            },
                            fileManager: {
                                imageEnrichment: flags.isEnabled(
                                    "aiPowerups.fileManager.imageEnrichment"
                                )
                                    ? project.package.features.aiPowerups?.options?.fileManager
                                          ?.imageEnrichment
                                    : false
                            },
                            lexicalGeneration: flags.isEnabled("aiPowerups.lexicalGeneration")
                                ? project.package.features.aiPowerups?.options?.lexicalGeneration
                                : false,
                            cms: {
                                entryGeneration: flags.isEnabled("aiPowerups.cms.entryGeneration")
                                    ? project.package.features.aiPowerups?.options?.cms
                                          ?.entryGeneration
                                    : false,
                                entryComparison: flags.isEnabled("aiPowerups.cms.entryComparison")
                                    ? project.package.features.aiPowerups?.options?.cms
                                          ?.entryComparison
                                    : false,
                                entryTranslation: flags.isEnabled("aiPowerups.cms.entryTranslation")
                                    ? project.package.features.aiPowerups?.options?.cms
                                          ?.entryTranslation
                                    : false
                            }
                        }
                    },
                    abTesting: {
                        ...project.package.features.abTesting,
                        enabled: flags.isEnabled("abTesting")
                            ? project.package.features.abTesting?.enabled
                            : false
                    },
                    remoteComponents: {
                        ...project.package.features.remoteComponents,
                        enabled: flags.isEnabled("remoteComponents")
                            ? project.package.features.remoteComponents?.enabled
                            : false
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
        return (
            this.decoratee.canUseAacl() &&
            this.featureFlags.get().isEnabled("advancedAccessControlLayer")
        );
    }

    canUseTeams() {
        return (
            this.decoratee.canUseTeams() &&
            this.featureFlags.get().isEnabled("advancedAccessControlLayer.teams")
        );
    }

    canUseFolderLevelPermissions() {
        return (
            this.decoratee.canUseFolderLevelPermissions() &&
            this.featureFlags.get().isEnabled("advancedAccessControlLayer.folderLevelPermissions")
        );
    }

    canUsePrivateFiles() {
        return (
            this.decoratee.canUsePrivateFiles() &&
            this.featureFlags.get().isEnabled("advancedAccessControlLayer.privateFiles")
        );
    }

    canUseAuditLogs() {
        return this.decoratee.canUseAuditLogs() && this.featureFlags.get().isEnabled("auditLogs");
    }

    canUseRecordLocking() {
        return (
            this.decoratee.canUseRecordLocking() &&
            this.featureFlags.get().isEnabled("recordLocking")
        );
    }

    canUseFileManagerThreatDetection() {
        return (
            this.decoratee.canUseFileManagerThreatDetection() &&
            this.featureFlags.get().isEnabled("fileManager.threatDetection")
        );
    }

    canUseWorkflows() {
        return (
            this.decoratee.canUseWorkflows() &&
            this.featureFlags.get().isEnabled("advancedPublishingWorkflow")
        );
    }

    canUseHcmsFieldPermissions() {
        return (
            this.decoratee.canUseHcmsFieldPermissions() &&
            this.featureFlags.get().isEnabled("advancedAccessControlLayer.hcmsFieldPermissions")
        );
    }

    canUseAiImageEnrichment() {
        return (
            this.decoratee.canUseAiImageEnrichment() &&
            this.featureFlags.get().isEnabled("aiPowerups.fileManager.imageEnrichment")
        );
    }

    canUseAiPageGeneration() {
        return (
            this.decoratee.canUseAiPageGeneration() &&
            this.featureFlags.get().isEnabled("aiPowerups.websiteBuilder.pageGeneration")
        );
    }

    canUseAiPageTranslation() {
        return (
            this.decoratee.canUseAiPageTranslation() &&
            this.featureFlags.get().isEnabled("aiPowerups.websiteBuilder.pageTranslation")
        );
    }

    canUseAiLexicalGeneration() {
        return (
            this.decoratee.canUseAiLexicalGeneration() &&
            this.featureFlags.get().isEnabled("aiPowerups.lexicalGeneration")
        );
    }

    canUseAiEntryGeneration() {
        return (
            this.decoratee.canUseAiEntryGeneration() &&
            this.featureFlags.get().isEnabled("aiPowerups.cms.entryGeneration")
        );
    }

    canUseAiEntryComparison() {
        return (
            this.decoratee.canUseAiEntryComparison() &&
            this.featureFlags.get().isEnabled("aiPowerups.cms.entryComparison")
        );
    }

    canUseAiEntryTranslation() {
        return (
            this.decoratee.canUseAiEntryTranslation() &&
            this.featureFlags.get().isEnabled("aiPowerups.cms.entryTranslation")
        );
    }

    canUseAbTesting() {
        return this.decoratee.canUseAbTesting() && this.featureFlags.get().isEnabled("abTesting");
    }

    canUseRemoteComponents() {
        return (
            this.decoratee.canUseRemoteComponents() &&
            this.featureFlags.get().isEnabled("remoteComponents")
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

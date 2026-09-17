import { FeatureFlags } from "../abstractions.js";
import { FeatureFlags as FeatureFlagsClass } from "@webiny/feature-flags";
import type { FeatureFlagName } from "@webiny/feature-flags";
import type { ILicense } from "@webiny/wcp/types.js";
import { WcpLicenseProvider } from "~/features/wcp/WcpLicenseProvider.js";

/*
 * Feature flag resolution (license decorator).
 *
 * Two kinds of flag, and only one of them is Webiny's to sell:
 *
 * LICENSE-GOVERNED (listed in LICENSE_CHECKS) — the license is the authority:
 * 1. No license, or license blocks the flag → false, config ignored
 * 2. License allows + config unset          → true (the license grants it)
 * 3. License allows + config=false          → false (config may disable, never re-enable)
 *
 * EVERYTHING ELSE — the project's own flags. The config decides, and nothing is assumed:
 * 4. config=true           → true
 * 5. config=false or unset → false
 *
 * There is deliberately no third kind. A set of flags used to be enabled by default here, which was
 * a workaround for capabilities the license could not express: rather than gate them properly they
 * were left on for anyone holding any license at all. It also meant EVERY unrecognised name resolved
 * to true, so an undeclared flag and a typo both read as enabled. A feature that should be sold
 * belongs in LICENSE_CHECKS and on the license; anything else is the project's own to switch on.
 */

const LICENSE_CHECKS: Record<string, (license: ILicense) => boolean> = {
    multiTenancy: l => l.canUseFeature("multiTenancy"),
    advancedPublishingWorkflow: l => l.canUseWorkflows(),
    advancedAccessControlLayer: l => l.canUseAacl(),
    "advancedAccessControlLayer.teams": l => l.canUseTeams(),
    "advancedAccessControlLayer.privateFiles": l => l.canUsePrivateFiles(),
    "advancedAccessControlLayer.folderLevelPermissions": l => l.canUseFolderLevelPermissions(),
    "advancedAccessControlLayer.hcmsFieldPermissions": l => l.canUseHcmsFieldPermissions(),
    auditLogs: l => l.canUseAuditLogs(),
    recordLocking: l => l.canUseRecordLocking(),
    "fileManager.threatDetection": l => l.canUseFileManagerThreatDetection(),
    aiPowerups: l => l.canUseAiPowerups(),
    "aiPowerups.fileManager.imageEnrichment": l => l.canUseAiImageEnrichment(),
    "aiPowerups.websiteBuilder.pageGeneration": l => l.canUseAiPageGeneration(),
    "aiPowerups.websiteBuilder.pageTranslation": l => l.canUseAiPageTranslation(),
    "aiPowerups.lexicalGeneration": l => l.canUseAiLexicalGeneration(),
    "aiPowerups.cms.entryGeneration": l => l.canUseAiEntryGeneration(),
    "aiPowerups.cms.entryComparison": l => l.canUseAiEntryComparison(),
    "aiPowerups.cms.entryTranslation": l => l.canUseAiEntryTranslation(),
    abTesting: l => l.canUseAbTesting(),
    remoteComponents: l => l.canUseRemoteComponents(),
    collaboration: l => l.canUseCollaboration(),
    "collaboration.comments": l => l.canUseComments(),
    "collaboration.activityLog": l => l.canUseActivityLog()
};

class LicenseDecoratedFeatureFlags extends FeatureFlagsClass {
    constructor(
        private base: FeatureFlagsClass,
        private license: ILicense
    ) {
        super(base.toDto());
    }

    override isEnabled(name: FeatureFlagName): boolean {
        const check = LICENSE_CHECKS[name];
        if (check) {
            if (!check(this.license)) {
                return false;
            }
            // License allows — config can only disable, not re-enable blocked features.
            return !this.base.isExplicitlyDisabled(name);
        }
        /*
         * Everything else is the project's own, and the config is the only thing that decides. No
         * default: `isEnabled` on the base is true only for an explicitly configured `true`.
         *
         * This branch used to return `!isExplicitlyDisabled(name)` whenever a license existed, which
         * made EVERY unrecognised name true — an undeclared flag, or a typo like `aiPowerupz`. It also
         * returned false outright without a license, so an unlicensed install could not turn on a flag
         * it had declared itself. Neither is the license's business.
         */
        return this.base.isEnabled(name);
    }
}

class FeatureFlagsWithLicenseDecoratorImpl implements FeatureFlags.Interface {
    constructor(
        private licenseProvider: WcpLicenseProvider.Interface,
        private decoratee: FeatureFlags.Interface
    ) {}

    get(): FeatureFlagsClass {
        const base = this.decoratee.get();
        return new LicenseDecoratedFeatureFlags(base, this.licenseProvider.get());
    }
}

export const FeatureFlagsWithLicenseDecorator = FeatureFlags.createDecorator({
    decorator: FeatureFlagsWithLicenseDecoratorImpl,
    dependencies: [WcpLicenseProvider]
});

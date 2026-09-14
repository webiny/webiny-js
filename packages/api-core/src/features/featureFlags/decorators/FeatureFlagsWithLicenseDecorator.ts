import { FeatureFlags } from "../abstractions.js";
import { FeatureFlags as FeatureFlagsClass } from "@webiny/feature-flags";
import type { FeatureFlagName } from "@webiny/feature-flags";
import type { ILicense } from "@webiny/wcp/types.js";
import { WcpLicenseProvider } from "~/features/wcp/WcpLicenseProvider.js";

/*
 * Feature flag resolution (license decorator).
 *
 * Three kinds of flag, and only one of them is Webiny's to sell:
 *
 * LICENSE-GOVERNED (listed in LICENSE_CHECKS) — the license is the authority:
 * 1. No license, or license blocks the flag → false, config ignored
 * 2. License allows + config unset          → true (the license grants it)
 * 3. License allows + config=false          → false (config may disable, never re-enable)
 *
 * SHIPPED ON (listed in DEFAULT_ON) — Webiny features a project gets without asking:
 * 4. License present + config unset  → true
 * 5. License present + config=false  → false (config disables)
 * 6. No license                      → falls through to the rules below
 *
 * EVERYTHING ELSE — the project's own flags. The config decides, and nothing is assumed:
 * 7. config=true  → true
 * 8. config=false or unset → false
 *
 * Rule 8 is the one that changed. This branch used to be "on unless explicitly disabled" whenever a
 * license existed, which made every unrecognised name true — an undeclared flag, or a typo such as
 * `aiPowerupz`. The features that genuinely ship on are now named in DEFAULT_ON instead, so a flag
 * nobody declared is off, and declaring one in the config works with or without a license.
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
    "aiPowerups.fileManager.imageEnrichment": l => l.canUseAiImageEnrichment(),
    abTesting: l => l.canUseAbTesting()
};

/**
 * Not sold, but on unless a project turns them off.
 *
 * Listed explicitly rather than inferred from "everything unrecognised", so that adding a flag is a
 * decision someone makes here. `aiPowerups.fileManager.imageEnrichment` is absent on purpose: it is
 * in LICENSE_CHECKS above, so the license governs it.
 */
const DEFAULT_ON = new Set<string>([
    "aiPowerups",
    "aiPowerups.websiteBuilder.pageGeneration",
    "aiPowerups.websiteBuilder.pageTranslation",
    "aiPowerups.lexicalGeneration",
    "aiPowerups.cms.entryGeneration",
    "aiPowerups.cms.entryComparison",
    "aiPowerups.cms.entryTranslation",
    "remoteComponents"
]);

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
         * Webiny features that ship enabled, so a project does not have to list them to get them.
         * Still gated on a license existing at all, which is the behaviour these have always had.
         */
        if (DEFAULT_ON.has(name) && this.license.getRawLicense()) {
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

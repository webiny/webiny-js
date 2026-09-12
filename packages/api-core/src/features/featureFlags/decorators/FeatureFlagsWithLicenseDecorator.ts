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
 * EVERYTHING ELSE — Webiny features that ship on, plus a project's own custom flags:
 * 4. License present + config unset   → true  (on by default, e.g. `aiPowerups.*`)
 * 5. License present + config=false   → false (config disables)
 * 6. No license + config=true         → true  (a project may enable its OWN flags)
 * 7. No license + config unset        → false (nothing on by default)
 *
 * Rule 6 is the one to keep in mind: without it an unlicensed install cannot turn on a flag it
 * declared itself, which is not something the license should govern.
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
         * Not license-governed. With a license present these are on unless the config disables them —
         * that is how features like `aiPowerups.*` and `remoteComponents` ship enabled without every
         * project having to list them.
         *
         * Without a license nothing is on by default, but a project can still enable its OWN flags:
         * `isEnabled` on the base is true only for an explicitly configured `true`. Previously this
         * returned false outright, so an unlicensed install could not turn on a flag it had declared
         * itself — which is not the license's business to prevent.
         */
        if (!this.license.getRawLicense()) {
            return this.base.isEnabled(name);
        }

        return !this.base.isExplicitlyDisabled(name);
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

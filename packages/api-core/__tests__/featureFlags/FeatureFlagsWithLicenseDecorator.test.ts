import { describe, it, expect } from "vitest";
import { FeatureFlags as FeatureFlagsClass } from "@webiny/feature-flags";
import type { ILicense } from "@webiny/wcp/types.js";
import { Container } from "@webiny/di";
import { FeatureFlags } from "~/features/featureFlags/abstractions.js";
import { FeatureFlagsWithLicenseDecorator } from "~/features/featureFlags/decorators/FeatureFlagsWithLicenseDecorator.js";
import { WcpLicenseProvider } from "~/features/wcp/WcpLicenseProvider.js";

interface LicenseOptions {
    present: boolean;
    allowsAacl?: boolean;
}

const license = (options: LicenseOptions): ILicense =>
    ({
        getRawLicense: () => (options.present ? ({} as never) : null),
        canUseAacl: () => Boolean(options.allowsAacl),
        canUseFeature: () => false,
        canUseWorkflows: () => false,
        canUseTeams: () => false,
        canUsePrivateFiles: () => false,
        canUseFolderLevelPermissions: () => false,
        canUseHcmsFieldPermissions: () => false,
        canUseAuditLogs: () => false,
        canUseRecordLocking: () => false,
        canUseFileManagerThreatDetection: () => false,
        canUseAiImageEnrichment: () => false,
        canUseAbTesting: () => false
    }) as unknown as ILicense;

const flagsFor = (config: Record<string, unknown>, options: LicenseOptions) => {
    const container = new Container();

    container.registerInstance(FeatureFlags, {
        get: () => new FeatureFlagsClass(config as never)
    });
    container.registerInstance(WcpLicenseProvider, {
        get: () => license(options)
    } as never);
    container.registerDecorator(FeatureFlagsWithLicenseDecorator);

    return container.resolve(FeatureFlags).get();
};

describe("FeatureFlagsWithLicenseDecorator", () => {
    describe("license-governed flags", () => {
        it("stays off when the license blocks it, even if config enables it", () => {
            const flags = flagsFor(
                { advancedAccessControlLayer: true },
                { present: true, allowsAacl: false }
            );

            expect(flags.isEnabled("advancedAccessControlLayer")).toBe(false);
        });

        it("is on when the license allows it and config is unset", () => {
            const flags = flagsFor({}, { present: true, allowsAacl: true });

            expect(flags.isEnabled("advancedAccessControlLayer")).toBe(true);
        });

        it("lets config disable what the license allows", () => {
            const flags = flagsFor(
                { advancedAccessControlLayer: false },
                { present: true, allowsAacl: true }
            );

            expect(flags.isEnabled("advancedAccessControlLayer")).toBe(false);
        });
    });

    describe("non-license-governed flags", () => {
        /*
         * With a license these ship ON unless disabled — `aiPowerups.*` and `remoteComponents` rely on
         * this, and none of them are listed in a project's config.
         */
        it("is on by default when a license is present", () => {
            const flags = flagsFor({}, { present: true });

            expect(flags.isEnabled("aiPowerups.cms.entryGeneration")).toBe(true);
        });

        it("lets config disable it", () => {
            const flags = flagsFor(
                { aiPowerups: { cms: { entryGeneration: false } } },
                { present: true }
            );

            expect(flags.isEnabled("aiPowerups.cms.entryGeneration")).toBe(false);
        });

        /*
         * The reason this decorator changed: an unlicensed install could not enable a flag it had
         * declared itself, which the license has no business preventing.
         */
        it("can be enabled by config with no license at all", () => {
            const flags = flagsFor({ myCustomFlag: true }, { present: false });

            expect(flags.isEnabled("myCustomFlag")).toBe(true);
        });

        it("stays off without a license when config does not enable it", () => {
            const flags = flagsFor({ myCustomFlag: true }, { present: false });

            expect(flags.isEnabled("somethingElse")).toBe(false);
        });

        it("supports nested custom flags without a license", () => {
            const flags = flagsFor({ myApp: { newThing: true } }, { present: false });

            expect(flags.isEnabled("myApp.newThing")).toBe(true);
            expect(flags.isEnabled("myApp.otherThing")).toBe(false);
        });
    });
});

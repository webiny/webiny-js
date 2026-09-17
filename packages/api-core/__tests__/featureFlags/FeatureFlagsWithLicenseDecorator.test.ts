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
    allowsEntryGeneration?: boolean;
    allowsRemoteComponents?: boolean;
    allowsComments?: boolean;
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
        canUseAiPageGeneration: () => false,
        canUseAiPageTranslation: () => false,
        canUseAiLexicalGeneration: () => false,
        canUseAiEntryGeneration: () => Boolean(options.allowsEntryGeneration),
        canUseAiEntryComparison: () => false,
        canUseAiEntryTranslation: () => false,
        canUseAiPowerups: () => Boolean(options.allowsEntryGeneration),
        canUseAbTesting: () => false,
        canUseRemoteComponents: () => Boolean(options.allowsRemoteComponents),
        canUseCollaboration: () => Boolean(options.allowsComments),
        canUseComments: () => Boolean(options.allowsComments),
        canUseActivityLog: () => false
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

    describe("capabilities the license sells", () => {
        /*
         * Every one of these used to be config-governed, because the accessor existed on the license
         * but nothing wired it into LICENSE_CHECKS. Config alone could turn on something the customer
         * had not bought.
         */
        it("keeps an AI capability off when the license withholds it, whatever config says", () => {
            const flags = flagsFor(
                { aiPowerups: { cms: { entryGeneration: true } } },
                { present: true, allowsEntryGeneration: false }
            );

            expect(flags.isEnabled("aiPowerups.cms.entryGeneration")).toBe(false);
        });

        it("grants an AI capability the license allows, with no config", () => {
            const flags = flagsFor({}, { present: true, allowsEntryGeneration: true });

            expect(flags.isEnabled("aiPowerups.cms.entryGeneration")).toBe(true);
        });

        it("lets config disable an AI capability the license allows", () => {
            const flags = flagsFor(
                { aiPowerups: { cms: { entryGeneration: false } } },
                { present: true, allowsEntryGeneration: true }
            );

            expect(flags.isEnabled("aiPowerups.cms.entryGeneration")).toBe(false);
        });

        /*
         * The parent is derived from the children rather than read off `aiPowerups.enabled`, because
         * WCP has projects carrying capabilities under a parent that reads false.
         */
        it("turns the aiPowerups parent on when any child capability is licensed", () => {
            const flags = flagsFor({}, { present: true, allowsEntryGeneration: true });

            expect(flags.isEnabled("aiPowerups")).toBe(true);
        });

        it("leaves the aiPowerups parent off when no child capability is licensed", () => {
            const flags = flagsFor({}, { present: true });

            expect(flags.isEnabled("aiPowerups")).toBe(false);
        });

        it("governs remote components, which no license ever granted before", () => {
            const licensed = flagsFor({}, { present: true, allowsRemoteComponents: true });
            const unlicensed = flagsFor({ remoteComponents: true }, { present: true });

            expect(licensed.isEnabled("remoteComponents")).toBe(true);
            expect(unlicensed.isEnabled("remoteComponents")).toBe(false);
        });

        it("governs collaboration", () => {
            const licensed = flagsFor({}, { present: true, allowsComments: true });
            const unlicensed = flagsFor({ collaboration: { comments: true } }, { present: true });

            expect(licensed.isEnabled("collaboration.comments")).toBe(true);
            expect(licensed.isEnabled("collaboration.activityLog")).toBe(false);
            expect(unlicensed.isEnabled("collaboration.comments")).toBe(false);
        });
    });

    describe("a project's own flags", () => {
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

        it("is enabled by config with a license present too", () => {
            const flags = flagsFor({ myCustomFlag: true }, { present: true });

            expect(flags.isEnabled("myCustomFlag")).toBe(true);
        });

        /*
         * The bug this closes. A license used to make EVERY unrecognised name true, because the
         * branch was "on unless explicitly disabled". An undeclared flag was on, and so was a typo,
         * which is the part that made it dangerous: `isEnabled("aiPowerupz")` guarded nothing and
         * read as if it did.
         */
        it("is off when nothing declared it, even with a license", () => {
            const flags = flagsFor({}, { present: true });

            expect(flags.isEnabled("experimentalSuperFeat")).toBe(false);
            expect(flags.isEnabled("aiPowerupz")).toBe(false);
        });

        it("is off when config disables it", () => {
            const flags = flagsFor({ myCustomFlag: false }, { present: true });

            expect(flags.isEnabled("myCustomFlag")).toBe(false);
        });
    });
});

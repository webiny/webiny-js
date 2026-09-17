import { describe, it, expect } from "vitest";
import { FeatureFlags as FeatureFlagsClass } from "@webiny/feature-flags";
import type { WCP_FEATURE_LABEL } from "@webiny/wcp";
import type { ILicense } from "@webiny/wcp/types.js";
import { Container } from "@webiny/di";
import { FeatureFlags } from "~/features/featureFlags/abstractions.js";
import { FeatureFlagsWithLicenseDecorator } from "~/features/featureFlags/decorators/FeatureFlagsWithLicenseDecorator.js";
import { WcpLicenseProvider } from "~/features/wcp/WcpLicenseProvider.js";

/*
 * Every `canUse*` accessor on the license, so the fake answers all of them rather than only the ones
 * a test happens to flip. `AssertNever` below fails the build when `ILicense` grows one that is
 * missing here, which is what keeps the two in step.
 */
type LicenseCapability = Exclude<
    keyof ILicense,
    "getRawLicense" | "getProject" | "toDto" | "canUseFeature"
>;

const LICENSE_CAPABILITIES = [
    "canUseAacl",
    "canUseTeams",
    "canUseAuditLogs",
    "canUsePrivateFiles",
    "canUseFileManagerThreatDetection",
    "canUseFolderLevelPermissions",
    "canUseRecordLocking",
    "canUseWorkflows",
    "canUseHcmsFieldPermissions",
    "canUseAiImageEnrichment",
    "canUseAiPageGeneration",
    "canUseAiPageTranslation",
    "canUseAiLexicalGeneration",
    "canUseAiAdminAssistant",
    "canUseAiEntryGeneration",
    "canUseAiEntryComparison",
    "canUseAiEntryTranslation",
    "canUseAbTesting",
    "canUseRemoteComponents",
    "canUseAiPowerups",
    "canUseCollaboration",
    "canUseComments",
    "canUseActivityLog"
] as const satisfies readonly LicenseCapability[];

type AssertNever<T extends never> = T;
type _EveryCapabilityIsCovered = AssertNever<
    Exclude<LicenseCapability, (typeof LICENSE_CAPABILITIES)[number]>
>;

interface LicenseOptions {
    present: boolean;
    // What the license sells. Anything not listed is withheld.
    allows?: LicenseCapability[];
    // `canUseFeature` is the older, string-keyed way of asking the same question.
    allowsFeatures?: (keyof typeof WCP_FEATURE_LABEL)[];
}

const license = ({ present, allows = [], allowsFeatures = [] }: LicenseOptions): ILicense => {
    const granted = new Set<LicenseCapability>(allows);

    return {
        ...Object.fromEntries(LICENSE_CAPABILITIES.map(name => [name, () => granted.has(name)])),
        getRawLicense: () => (present ? {} : null),
        canUseFeature: (featureId: keyof typeof WCP_FEATURE_LABEL) =>
            allowsFeatures.includes(featureId)
    } as unknown as ILicense;
};

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
            const flags = flagsFor({ advancedAccessControlLayer: true }, { present: true });

            expect(flags.isEnabled("advancedAccessControlLayer")).toBe(false);
        });

        it("is on when the license allows it and config is unset", () => {
            const flags = flagsFor({}, { present: true, allows: ["canUseAacl"] });

            expect(flags.isEnabled("advancedAccessControlLayer")).toBe(true);
        });

        it("lets config disable what the license allows", () => {
            const flags = flagsFor(
                { advancedAccessControlLayer: false },
                { present: true, allows: ["canUseAacl"] }
            );

            expect(flags.isEnabled("advancedAccessControlLayer")).toBe(false);
        });

        // The one flag still asked for by name rather than through a dedicated accessor.
        it("governs multiTenancy through canUseFeature", () => {
            const licensed = flagsFor({}, { present: true, allowsFeatures: ["multiTenancy"] });
            const unlicensed = flagsFor({ multiTenancy: true }, { present: true });

            expect(licensed.isEnabled("multiTenancy")).toBe(true);
            expect(unlicensed.isEnabled("multiTenancy")).toBe(false);
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
                { present: true }
            );

            expect(flags.isEnabled("aiPowerups.cms.entryGeneration")).toBe(false);
        });

        it("grants an AI capability the license allows, with no config", () => {
            const flags = flagsFor({}, { present: true, allows: ["canUseAiEntryGeneration"] });

            expect(flags.isEnabled("aiPowerups.cms.entryGeneration")).toBe(true);
        });

        it("lets config disable an AI capability the license allows", () => {
            const flags = flagsFor(
                { aiPowerups: { cms: { entryGeneration: false } } },
                { present: true, allows: ["canUseAiEntryGeneration"] }
            );

            expect(flags.isEnabled("aiPowerups.cms.entryGeneration")).toBe(false);
        });

        /*
         * The `aiPowerups` parent is a license check of its own, so it is asked separately here.
         * Whether the license derives that answer from its children is `License.canUseAiPowerups`'s
         * business, not this decorator's.
         */
        it("asks the license about the aiPowerups parent", () => {
            const flags = flagsFor({}, { present: true, allows: ["canUseAiPowerups"] });

            expect(flags.isEnabled("aiPowerups")).toBe(true);
        });

        it("leaves the aiPowerups parent off when the license withholds it", () => {
            const flags = flagsFor({}, { present: true });

            expect(flags.isEnabled("aiPowerups")).toBe(false);
        });

        /*
         * The assistant shipped ungated: it had no accessor, no LICENSE_CHECKS entry, and no flag
         * check anywhere in the chat feature, so every project got it regardless of license.
         */
        it("governs the admin assistant, which shipped ungated", () => {
            const licensed = flagsFor({}, { present: true, allows: ["canUseAiAdminAssistant"] });
            const unlicensed = flagsFor(
                { aiPowerups: { adminAssistant: true } },
                { present: true }
            );

            expect(licensed.isEnabled("aiPowerups.adminAssistant")).toBe(true);
            expect(unlicensed.isEnabled("aiPowerups.adminAssistant")).toBe(false);
        });

        it("lets config disable the admin assistant the license allows", () => {
            const flags = flagsFor(
                { aiPowerups: { adminAssistant: false } },
                { present: true, allows: ["canUseAiAdminAssistant"] }
            );

            expect(flags.isEnabled("aiPowerups.adminAssistant")).toBe(false);
        });

        it("governs remote components, which no license ever granted before", () => {
            const licensed = flagsFor({}, { present: true, allows: ["canUseRemoteComponents"] });
            const unlicensed = flagsFor({ remoteComponents: true }, { present: true });

            expect(licensed.isEnabled("remoteComponents")).toBe(true);
            expect(unlicensed.isEnabled("remoteComponents")).toBe(false);
        });

        it("governs collaboration", () => {
            const licensed = flagsFor(
                {},
                { present: true, allows: ["canUseCollaboration", "canUseComments"] }
            );
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

import { Container } from "@webiny/di";
import { describe, expect, it } from "vitest";
import { License, NullLicense } from "@webiny/wcp";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";
import { WcpContext as PublicWcpContext } from "~/exports/api/wcp.js";
import { WcpFeature } from "~/features/wcp/WcpFeature.js";
import { BuildParamsFeature } from "~/features/buildParams/feature.js";
import { FeatureFlagsFeature } from "~/features/featureFlags/feature.js";

// A license carrying a feature core has no named check for, as WCP would issue it for an extension.
function licenseWithExtensionFeature(): DecryptedWcpProjectLicense {
    const dto = createTestWcpLicense();
    const features = dto.package.features as unknown as Record<string, unknown>;
    features.myExtension = { enabled: true, options: { generation: true, export: false } };
    features.myDisabledExtension = { enabled: false, options: { generation: true } };
    return dto;
}

describe("isFeatureLicensed", () => {
    it("is true for a licensed feature by name", () => {
        const license = License.fromLicenseDto(licenseWithExtensionFeature());

        expect(license.isFeatureLicensed("myExtension")).toBe(true);
        expect(license.isFeatureLicensed("advancedPublishingWorkflow")).toBe(true);
    });

    it("is true for a licensed option, by dotted name", () => {
        const license = License.fromLicenseDto(licenseWithExtensionFeature());

        expect(license.isFeatureLicensed("myExtension.generation")).toBe(true);
        expect(license.isFeatureLicensed("advancedAccessControlLayer.teams")).toBe(true);
        // Read as stored, like the AI Power-Ups checks: the parent's `enabled` isn't consulted.
        expect(license.isFeatureLicensed("myDisabledExtension.generation")).toBe(true);
    });

    it("is false for a disabled feature or option", () => {
        const license = License.fromLicenseDto(licenseWithExtensionFeature());

        expect(license.isFeatureLicensed("myDisabledExtension")).toBe(false);
        expect(license.isFeatureLicensed("myExtension.export")).toBe(false);
        expect(license.isFeatureLicensed("auditLogs")).toBe(false);
    });

    it("is false for an unknown name", () => {
        const license = License.fromLicenseDto(licenseWithExtensionFeature());

        expect(license.isFeatureLicensed("notAFeature")).toBe(false);
        expect(license.isFeatureLicensed("myExtension.notAnOption")).toBe(false);
        expect(license.isFeatureLicensed("seats.maxCount")).toBe(false);
        expect(license.isFeatureLicensed("toString")).toBe(false);
        expect(license.isFeatureLicensed("")).toBe(false);
    });

    it("is false on NullLicense", () => {
        const license = new NullLicense();

        expect(license.isFeatureLicensed("myExtension")).toBe(false);
        expect(license.isFeatureLicensed("multiTenancy")).toBe(false);
    });

    it("leaves the existing named checks as they were", () => {
        const license = License.fromLicenseDto(licenseWithExtensionFeature());

        expect(license.canUseFeature("advancedPublishingWorkflow")).toBe(true);
        expect(license.canUseFeature("auditLogs")).toBe(false);
        expect(license.canUseTeams()).toBe(true);
        expect(license.canUseRecordLocking()).toBe(false);
        expect(license.canUseAiPowerups()).toBe(false);
    });

    it("is answered by WcpContext, reachable from the public export", () => {
        const container = new Container();
        BuildParamsFeature.register(container);
        FeatureFlagsFeature.register(container);
        WcpFeature.register(container, License.fromLicenseDto(licenseWithExtensionFeature()));

        expect(PublicWcpContext).toBe(WcpContext);

        const wcpContext = container.resolve(PublicWcpContext);
        expect(wcpContext.isFeatureLicensed("myExtension.generation")).toBe(true);
        expect(wcpContext.isFeatureLicensed("notAFeature")).toBe(false);
    });
});

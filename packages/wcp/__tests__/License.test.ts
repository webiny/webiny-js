import { describe, it, expect } from "vitest";
import { License } from "~/License.js";
import type { DecryptedWcpProjectLicense } from "~/types.js";

const licenseWithAiOptions = (options: Record<string, unknown>) =>
    License.fromLicenseDto({
        orgId: "org",
        projectId: "project",
        package: {
            features: {
                aiPowerups: { enabled: true, options }
            }
        }
    } as unknown as DecryptedWcpProjectLicense);

/*
 * `canUseAiPowerups` is derived from the individual AI capabilities. Remote components were one of
 * them until they left core; every licence with another AI option keeps AI Power-Ups as before.
 */
describe("License.canUseAiPowerups", () => {
    it.each([
        ["image enrichment", { fileManager: { imageEnrichment: true } }],
        ["page generation", { websiteBuilder: { pageGeneration: true } }],
        ["page translation", { websiteBuilder: { pageTranslation: true } }],
        ["lexical generation", { lexicalGeneration: true }],
        ["admin assistant", { adminAssistant: true }],
        ["entry generation", { cms: { entryGeneration: true } }],
        ["entry comparison", { cms: { entryComparison: true } }],
        ["entry translation", { cms: { entryTranslation: true } }]
    ])("is true with %s licensed", (_name, options) => {
        expect(licenseWithAiOptions(options).canUseAiPowerups()).toBe(true);
    });

    it("is false with no AI option licensed", () => {
        expect(licenseWithAiOptions({}).canUseAiPowerups()).toBe(false);
    });

    it("no longer counts a remote components option", () => {
        expect(licenseWithAiOptions({ remoteComponents: true }).canUseAiPowerups()).toBe(false);
    });
});

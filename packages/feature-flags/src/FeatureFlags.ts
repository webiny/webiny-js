import type { IFeatureFlagsDto } from "./types.js";

export type KnownFeatureFlag =
    | "multiTenancy"
    | "advancedPublishingWorkflow"
    | "advancedAccessControlLayer"
    | "advancedAccessControlLayer.teams"
    | "advancedAccessControlLayer.privateFiles"
    | "advancedAccessControlLayer.folderLevelPermissions"
    | "advancedAccessControlLayer.hcmsFieldPermissions"
    | "auditLogs"
    | "recordLocking"
    | "fileManager.threatDetection"
    | "aiPowerups"
    | "aiPowerups.websiteBuilder.pageGeneration"
    | "aiPowerups.websiteBuilder.pageTranslation"
    | "aiPowerups.fileManager.imageEnrichment"
    | "aiPowerups.lexicalGeneration"
    | "aiPowerups.cms.entryGeneration"
    | "aiPowerups.cms.entryComparison"
    | "aiPowerups.cms.entryTranslation"
    | "abTesting"
    | "remoteComponents"
    | "aiChat";

export type FeatureFlagName = KnownFeatureFlag | (string & {});

export class FeatureFlags {
    static fromDto(dto: IFeatureFlagsDto): FeatureFlags {
        return new FeatureFlags(dto);
    }

    constructor(private readonly flags: IFeatureFlagsDto = {}) {}

    isExplicitlyDisabled(name: FeatureFlagName): boolean {
        const segments = name.split(".");
        let current: unknown = this.flags;

        for (let i = 0; i < segments.length; i++) {
            if (current === false) {
                return true;
            }
            if (current === undefined || current === true) {
                return false;
            }
            if (typeof current === "object" && current !== null) {
                current = (current as Record<string, unknown>)[segments[i]];
                continue;
            }
            return false;
        }

        return current === false;
    }

    isEnabled(name: FeatureFlagName): boolean {
        const segments = name.split(".");
        let current: unknown = this.flags;

        for (let i = 0; i < segments.length; i++) {
            if (current === false || current === undefined) {
                return false;
            }
            if (current === true) {
                return true;
            }
            if (typeof current === "object" && current !== null) {
                current = (current as Record<string, unknown>)[segments[i]];
                continue;
            }
            return false;
        }

        // After walking all segments: object = enabled (group with sub-options),
        // true = enabled, false/undefined = disabled.
        if (typeof current === "object" && current !== null) {
            return true;
        }
        return current === true;
    }

    toDto() {
        return {
            multiTenancy: this.isEnabled("multiTenancy"),
            advancedPublishingWorkflow: this.isEnabled("advancedPublishingWorkflow"),
            advancedAccessControlLayer: this.isEnabled("advancedAccessControlLayer")
                ? {
                      teams: this.isEnabled("advancedAccessControlLayer.teams"),
                      privateFiles: this.isEnabled("advancedAccessControlLayer.privateFiles"),
                      folderLevelPermissions: this.isEnabled(
                          "advancedAccessControlLayer.folderLevelPermissions"
                      ),
                      hcmsFieldPermissions: this.isEnabled(
                          "advancedAccessControlLayer.hcmsFieldPermissions"
                      )
                  }
                : false,
            auditLogs: this.isEnabled("auditLogs"),
            recordLocking: this.isEnabled("recordLocking"),
            fileManager: {
                threatDetection: this.isEnabled("fileManager.threatDetection")
            },
            aiPowerups: this.isEnabled("aiPowerups")
                ? {
                      websiteBuilder: {
                          pageGeneration: this.isEnabled(
                              "aiPowerups.websiteBuilder.pageGeneration"
                          ),
                          pageTranslation: this.isEnabled(
                              "aiPowerups.websiteBuilder.pageTranslation"
                          )
                      },
                      fileManager: {
                          imageEnrichment: this.isEnabled("aiPowerups.fileManager.imageEnrichment")
                      },
                      lexicalGeneration: this.isEnabled("aiPowerups.lexicalGeneration"),
                      cms: {
                          entryGeneration: this.isEnabled("aiPowerups.cms.entryGeneration"),
                          entryComparison: this.isEnabled("aiPowerups.cms.entryComparison"),
                          entryTranslation: this.isEnabled("aiPowerups.cms.entryTranslation")
                      }
                  }
                : false,
            abTesting: this.isEnabled("abTesting"),
            remoteComponents: this.isEnabled("remoteComponents"),
            aiChat: this.isEnabled("aiChat")
        };
    }
}

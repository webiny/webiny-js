import React from "react";
import { z } from "zod";
import { BuildParam } from "./ApiBuildParam.js";
import { AdminBuildParam } from "./AdminBuildParam.js";
import { defineExtension } from "~/defineExtension/index.js";
import { setProjectFeatureFlags } from "~/services/GetProjectConfigService/FeatureFlagsContext.js";

export const FeatureFlags = defineExtension({
    type: "FeatureFlags",
    tags: { runtimeContext: "project" },
    description: "Enable or disable features.",
    paramsSchema: z.object({
        // Follows `IFeatureFlagsDto` from `packages/feature-flags/src/types.ts`.
        features: z.object({
            multiTenancy: z.boolean().optional(),
            advancedPublishingWorkflow: z.boolean().optional(),
            advancedAccessControlLayer: z
                .union([
                    z.boolean(),
                    z.object({
                        teams: z.boolean().optional(),
                        privateFiles: z.boolean().optional(),
                        folderLevelPermissions: z.boolean().optional(),
                        hcmsFieldPermissions: z.boolean().optional()
                    })
                ])
                .optional(),
            auditLogs: z.boolean().optional(),
            recordLocking: z.boolean().optional(),
            fileManager: z
                .object({
                    threatDetection: z.boolean().optional()
                })
                .optional(),
            aiPowerups: z
                .union([
                    z.boolean(),
                    z.object({
                        websiteBuilder: z
                            .object({
                                pageGeneration: z.boolean().optional(),
                                pageTranslation: z.boolean().optional()
                            })
                            .optional(),
                        fileManager: z
                            .object({
                                imageEnrichment: z.boolean().optional()
                            })
                            .optional(),
                        lexicalGeneration: z.boolean().optional(),
                        cms: z
                            .object({
                                entryGeneration: z.boolean().optional(),
                                entryComparison: z.boolean().optional(),
                                entryTranslation: z.boolean().optional()
                            })
                            .optional()
                    })
                ])
                .optional(),
            abTesting: z.boolean().optional(),
            remoteComponents: z.boolean().optional(),
            aiChat: z.boolean().optional()
        })
    }),
    render: ({ features = {} }) => {
        setProjectFeatureFlags(features);
        return (
            <>
                <BuildParam paramName="FeatureFlags" value={features} />
                <AdminBuildParam paramName="FeatureFlags" value={features} />
            </>
        );
    }
});

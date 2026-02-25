import React from "react";
import { z } from "zod";
import { BuildParam } from "./ApiBuildParam.js";
import { AdminBuildParam } from "./AdminBuildParam.js";
import { defineExtension } from "~/defineExtension/index.js";

export const FeatureFlags = defineExtension({
    type: "FeatureFlags",
    tags: { runtimeContext: "project" },
    description: "Enable or disable WCP features.",
    paramsSchema: z.object({
        // Follows `IFeatureFlags` from `packages/feature-flags/src/index.ts`.
        features: z.object({
            wcp: z.object({
                multiTenancy: z.object({ enabled: z.boolean().optional() }).optional(),
                advancedPublishingWorkflow: z
                    .object({ enabled: z.boolean().optional() })
                    .optional(),
                advancedAccessControlLayer: z
                    .object({
                        enabled: z.boolean().optional(),
                        options: z
                            .object({
                                teams: z.boolean().optional(),
                                privateFiles: z.boolean().optional(),
                                folderLevelPermissions: z.boolean().optional()
                            })
                            .optional()
                    })
                    .optional(),
                auditLogs: z.object({ enabled: z.boolean().optional() }).optional(),
                recordLocking: z.object({ enabled: z.boolean().optional() }).optional(),
                fileManager: z
                    .object({
                        options: z.object({ threatDetection: z.boolean().optional() }).optional()
                    })
                    .optional()
            })
        })
    }),
    render: ({ features = {} }) => {
        return (
            <>
                <BuildParam paramName="FeatureFlags" value={features} />
                <AdminBuildParam paramName="FeatureFlags" value={features} />
            </>
        );
    }
});

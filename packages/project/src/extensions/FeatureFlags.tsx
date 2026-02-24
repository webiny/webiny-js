import React from "react";
import { z } from "zod";
import { BuildParam } from "./ApiBuildParam.js";
import { AdminBuildParam } from "./AdminBuildParam.js";
import { defineExtension } from "~/defineExtension/index.js";

// Zod schema mirrors WcpFeatureFlags from @webiny/wcp/types.ts.
// Keep both in sync when adding new features.
const featureFlagsSchema = z.object({
    multiTenancy: z.object({ enabled: z.boolean().optional() }).optional(),
    advancedPublishingWorkflow: z.object({ enabled: z.boolean().optional() }).optional(),
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
});

export type FeatureFlagsInput = z.infer<typeof featureFlagsSchema>;

const FeatureFlagsExtension = defineExtension({
    type: "Wcp/FeatureFlags",
    tags: { runtimeContext: "project" },
    description: "Enable or disable WCP features.",
    paramsSchema: z.object({
        features: featureFlagsSchema.optional()
    }),
    render: ({ features = {} }) => {
        return (
            <>
                <BuildParam paramName="Wcp/FeatureFlags" value={features} />
                <AdminBuildParam paramName="Wcp/FeatureFlags" value={features} />
            </>
        );
    }
});

export const Wcp = {
    FeatureFlags: FeatureFlagsExtension
};


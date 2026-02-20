import React from "react";
import { defineExtension } from "~/defineExtension/index.js";
import { z } from "zod";

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

export type WcpFeatureFlagsInput = z.infer<typeof featureFlagsSchema>;

// Thin facades for Api/BuildParam and Admin/BuildParam.
// packages/project cannot import from @webiny/api-core or @webiny/app-admin (circular deps).
// These facades render the same property-tree entries as the real components.
// The actual build() logic is provided by the definitions from those packages,
// which are registered by packages/project-aws.
const ApiBuildParam = defineExtension({
    type: "Api/BuildParam",
    tags: { runtimeContext: "app-build", appName: "api" },
    multiple: true,
    paramsSchema: z.object({ paramName: z.string(), value: z.any() })
});

const AdminBuildParam = defineExtension({
    type: "Admin/BuildParam",
    tags: { runtimeContext: "app-build", appName: "admin" },
    multiple: true,
    paramsSchema: z.object({ paramName: z.string(), value: z.any() })
});

const WcpFeatureFlagsExtension = defineExtension({
    type: "Wcp/FeatureFlags",
    tags: { runtimeContext: "project" },
    description: "Enable or disable WCP features.",
    paramsSchema: z.object({
        features: featureFlagsSchema.optional()
    }),
    render: ({ features = {} }) => {
        return (
            <>
                <ApiBuildParam paramName="Wcp/FeatureFlags" value={features} />
                <AdminBuildParam paramName="Wcp/FeatureFlags" value={features} />
            </>
        );
    }
});

export const Wcp = {
    FeatureFlags: WcpFeatureFlagsExtension
};

// Only WcpFeatureFlagsExtension.def is registered here.
// ApiBuildParam and AdminBuildParam facades are NOT registered — their real definitions
// (with build methods) are already registered by packages/project-aws via api-core and app-admin.
export const wcpDefinitions = [WcpFeatureFlagsExtension.def];

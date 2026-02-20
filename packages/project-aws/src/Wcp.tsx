import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { z } from "zod";
import { Api } from "./api.js";
import { Admin } from "./admin.js";

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
            enabled: z.boolean().optional(),
            options: z.object({ threatDetection: z.boolean().optional() }).optional()
        })
        .optional()
});

export type WcpFeatureFlagsInput = z.infer<typeof featureFlagsSchema>;

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
                <Api.BuildParam paramName="Wcp/FeatureFlags" value={features} />
                <Admin.BuildParam paramName="Wcp/FeatureFlags" value={features} />
            </>
        );
    }
});

export const Wcp = {
    FeatureFlags: WcpFeatureFlagsExtension
};

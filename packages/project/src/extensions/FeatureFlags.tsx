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
            multiTenancy: z.boolean().optional(),
            workflows: z.boolean().optional(),
            aacl: z
                .union([
                    z.boolean(),
                    z.object({
                        teams: z.boolean().optional(),
                        privateFiles: z.boolean().optional(),
                        folderLevelPermissions: z.boolean().optional()
                    })
                ])
                .optional(),
            auditLogs: z.boolean().optional(),
            recordLocking: z.boolean().optional(),
            fileManagerThreatDetection: z.boolean().optional()
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

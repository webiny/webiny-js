import React, { useEffect } from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { z } from "zod";
import { Api } from "./api.js";
import { Admin } from "./admin.js";
import { useWcpFeatureOverrides } from "@webiny/project/components/WcpFeatureOverridesContext.js";

/**
 * Partial version of the license ProjectPackageFeatures structure,
 * used to override individual feature flags.
 */
export interface WcpFeatureFlagsInput {
    multiTenancy?: { enabled?: boolean };
    advancedPublishingWorkflow?: { enabled?: boolean };
    advancedAccessControlLayer?: {
        enabled?: boolean;
        options?: {
            teams?: boolean;
            privateFiles?: boolean;
            folderLevelPermissions?: boolean;
        };
    };
    auditLogs?: { enabled?: boolean };
    recordLocking?: { enabled?: boolean };
    fileManager?: {
        enabled?: boolean;
        options?: { threatDetection?: boolean };
    };
}

interface FlatFeatureFlag {
    key: string;
    value: boolean;
}

function flattenFeatureFlags(features: WcpFeatureFlagsInput): FlatFeatureFlag[] {
    const result: FlatFeatureFlag[] = [];

    if (features.multiTenancy?.enabled !== undefined) {
        result.push({ key: "multiTenancy", value: features.multiTenancy.enabled });
    }
    if (features.advancedPublishingWorkflow?.enabled !== undefined) {
        result.push({ key: "workflows", value: features.advancedPublishingWorkflow.enabled });
    }
    if (features.advancedAccessControlLayer?.enabled !== undefined) {
        result.push({ key: "aacl", value: features.advancedAccessControlLayer.enabled });
    }
    if (features.advancedAccessControlLayer?.options?.teams !== undefined) {
        result.push({ key: "teams", value: features.advancedAccessControlLayer.options.teams });
    }
    if (features.advancedAccessControlLayer?.options?.privateFiles !== undefined) {
        result.push({
            key: "privateFiles",
            value: features.advancedAccessControlLayer.options.privateFiles
        });
    }
    if (features.advancedAccessControlLayer?.options?.folderLevelPermissions !== undefined) {
        result.push({
            key: "folderLevelPermissions",
            value: features.advancedAccessControlLayer.options.folderLevelPermissions
        });
    }
    if (features.auditLogs?.enabled !== undefined) {
        result.push({ key: "auditLogs", value: features.auditLogs.enabled });
    }
    if (features.recordLocking?.enabled !== undefined) {
        result.push({ key: "recordLocking", value: features.recordLocking.enabled });
    }
    if (features.fileManager?.enabled !== undefined) {
        result.push({ key: "fileManager", value: features.fileManager.enabled });
    }
    if (features.fileManager?.options?.threatDetection !== undefined) {
        result.push({
            key: "fileManagerThreatDetection",
            value: features.fileManager.options.threatDetection
        });
    }

    return result;
}

function WcpFeatureFlagOverrideRegistrar({
    featureKey,
    value
}: {
    featureKey: string;
    value: boolean;
}) {
    const { setOverride } = useWcpFeatureOverrides();

    useEffect(() => {
        setOverride(featureKey, value);
    }, [featureKey, value, setOverride]);

    return null;
}

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

const WcpFeatureFlagsExtension = defineExtension({
    type: "Wcp/FeatureFlags",
    tags: { runtimeContext: "project" },
    description: "Enable or disable WCP features.",
    paramsSchema: z.object({
        features: featureFlagsSchema.optional()
    }),
    render: ({ features = {} }) => {
        const flags = flattenFeatureFlags(features as WcpFeatureFlagsInput);
        return (
            <>
                {flags.map(({ key, value }) => {
                    const paramName = `wcp.feature.${key}`;
                    return (
                        <React.Fragment key={key}>
                            <WcpFeatureFlagOverrideRegistrar featureKey={key} value={value} />
                            <Api.BuildParam name={paramName} paramName={paramName} value={value} />
                            <Admin.BuildParam
                                name={paramName}
                                paramName={paramName}
                                value={value}
                            />
                        </React.Fragment>
                    );
                })}
            </>
        );
    }
});

export const Wcp = {
    FeatureFlags: WcpFeatureFlagsExtension
};


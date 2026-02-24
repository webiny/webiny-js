import React from "react";
import { useWcp } from "~/presentation/wcp/useWcp.js";
import { useContainer } from "@webiny/app";
import { BuildParams } from "~/features/buildParams/abstractions.js";
import type { IFeatureFlags } from "@webiny/feature-flags";

interface ChildrenProps {
    children: React.ReactNode;
}

function useWcpFeatureEnabled(featureName: string): boolean {
    const container = useContainer();
    try {
        const buildParams = container.resolve(BuildParams);
        const featureFlags = buildParams.get<IFeatureFlags>("FeatureFlags");
        const features = featureFlags?.wcp;
        if (!features) {
            return true;
        }

        switch (featureName) {
            case "teams":
                return features.advancedAccessControlLayer?.options?.teams !== false;
            case "privateFiles":
                return features.advancedAccessControlLayer?.options?.privateFiles !== false;
            case "fileManagerThreatDetection":
                return features.fileManager?.options?.threatDetection !== false;
            case "workflows":
                return features.advancedPublishingWorkflow?.enabled !== false;
            default:
                return true;
        }
    } catch {
        return true;
    }
}

function CanUseTeams({ children }: ChildrenProps) {
    const wcp = useWcp();
    const enabled = useWcpFeatureEnabled("teams");

    return wcp.canUseTeams() && enabled ? <>{children}</> : null;
}

function CanUsePrivateFiles({ children }: ChildrenProps) {
    const wcp = useWcp();
    const enabled = useWcpFeatureEnabled("privateFiles");

    return wcp.canUsePrivateFiles() && enabled ? <>{children}</> : null;
}

function CanUseFileManagerThreatDetection({ children }: ChildrenProps) {
    const wcp = useWcp();
    const enabled = useWcpFeatureEnabled("fileManagerThreatDetection");

    return wcp.canUseFileManagerThreatDetection() && enabled ? <>{children}</> : null;
}

function CanUseWorkflows({ children }: ChildrenProps) {
    const wcp = useWcp();
    const enabled = useWcpFeatureEnabled("workflows");

    return wcp.canUseWorkflows() && enabled ? <>{children}</> : null;
}

export const Wcp = {
    CanUseTeams,
    CanUsePrivateFiles,
    CanUseFileManagerThreatDetection,
    CanUseWorkflows
};

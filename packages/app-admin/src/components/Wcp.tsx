import React from "react";
import { useWcp } from "~/presentation/wcp/useWcp.js";
import { useContainer } from "@webiny/app";
import { BuildParams } from "~/features/buildParams/abstractions.js";

interface ChildrenProps {
    children: React.ReactNode;
}

function useWcpFeatureEnabled(featureName: string): boolean {
    const container = useContainer();
    try {
        const buildParams = container.resolve(BuildParams);
        const value = buildParams.get<boolean>(`wcp.feature.${featureName}`);
        return value !== false;
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

import React from "react";
import { useWcp } from "~/presentation/wcp/useWcp.js";

interface ChildrenProps {
    children: React.ReactNode;
}

function CanUseTeams({ children }: ChildrenProps) {
    const wcp = useWcp();

    return wcp.canUseTeams() ? <>{children}</> : null;
}

function CanUsePrivateFiles({ children }: ChildrenProps) {
    const wcp = useWcp();

    return wcp.canUsePrivateFiles() ? <>{children}</> : null;
}

function CanUseFileManagerThreatDetection({ children }: ChildrenProps) {
    const wcp = useWcp();

    return wcp.canUseFileManagerThreatDetection() ? <>{children}</> : null;
}

export const Wcp = {
    CanUseTeams,
    CanUsePrivateFiles,
    CanUseFileManagerThreatDetection
};

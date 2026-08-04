import React from "react";
import { useWcp } from "~/presentation/wcp/useWcp.js";

interface ChildrenProps {
    children: React.ReactNode;
}

function CanUseMultiTenancy({ children }: ChildrenProps) {
    const wcp = useWcp();
    return wcp.canUseFeature("multiTenancy") ? <>{children}</> : null;
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

function CanUseWorkflows({ children }: ChildrenProps) {
    const wcp = useWcp();
    return wcp.canUseWorkflows() ? <>{children}</> : null;
}

function CanUseHcmsFieldPermissions({ children }: ChildrenProps) {
    const wcp = useWcp();
    return wcp.canUseHcmsFieldPermissions() ? <>{children}</> : null;
}

export const Wcp = {
    CanUseMultiTenancy,
    CanUseTeams,
    CanUsePrivateFiles,
    CanUseFileManagerThreatDetection,
    CanUseWorkflows,
    CanUseHcmsFieldPermissions
};

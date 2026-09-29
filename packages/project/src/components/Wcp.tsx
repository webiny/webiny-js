import React from "react";
import { useWcpProjectLicense } from "~/services/GetProjectConfigService/WcpProjectLicenseContext.js";

interface ChildrenProps {
    children: React.ReactNode;
}

function CanUseMultiTenancy({ children }: ChildrenProps) {
    const wcp = useWcpProjectLicense();

    return wcp.canUseMultiTenancy() ? <>{children}</> : null;
}

function CanUseTeams({ children }: ChildrenProps) {
    const wcp = useWcpProjectLicense();

    return wcp.canUseTeams() ? <>{children}</> : null;
}

function CanUsePrivateFiles({ children }: ChildrenProps) {
    const wcp = useWcpProjectLicense();

    return wcp.canUsePrivateFiles() ? <>{children}</> : null;
}

function CanUseFileManagerThreatDetection({ children }: ChildrenProps) {
    const wcp = useWcpProjectLicense();

    return wcp.canUseFileManagerThreatDetection() ? <>{children}</> : null;
}

function CanUseWorkflows({ children }: ChildrenProps) {
    const wcp = useWcpProjectLicense();

    return wcp.canUseWorkflows() ? <>{children}</> : null;
}

function CanUseHcmsFieldPermissions({ children }: ChildrenProps) {
    const wcp = useWcpProjectLicense();

    return wcp.canUseHcmsFieldPermissions() ? <>{children}</> : null;
}

/*
 * Any AI capability on the licence, derived the same way as `License.canUseAiPowerups`. Not
 * `CanUseMultiTenancy`, which AI Power-Ups was gated on originally: at this level that one only
 * checks that the project has a licence at all.
 */
function CanUseAiPowerups({ children }: ChildrenProps) {
    const wcp = useWcpProjectLicense();

    return wcp.canUseAiPowerups() ? <>{children}</> : null;
}

export const Wcp = {
    CanUseMultiTenancy,
    CanUseTeams,
    CanUsePrivateFiles,
    CanUseFileManagerThreatDetection,
    CanUseWorkflows,
    CanUseHcmsFieldPermissions,
    CanUseAiPowerups
};

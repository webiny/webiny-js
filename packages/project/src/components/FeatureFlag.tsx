import React from "react";
import { useProjectFeatureFlags } from "~/services/GetProjectConfigService/FeatureFlagsContext.js";

interface ChildrenProps {
    children: React.ReactNode;
}

function CanUseMultiTenancy({ children }: ChildrenProps) {
    const flags = useProjectFeatureFlags();
    return flags.isMultiTenancyEnabled() ? <>{children}</> : null;
}

function CanUseWorkflows({ children }: ChildrenProps) {
    const flags = useProjectFeatureFlags();
    return flags.isWorkflowsEnabled() ? <>{children}</> : null;
}

function CanUseTeams({ children }: ChildrenProps) {
    const flags = useProjectFeatureFlags();
    return flags.isTeamsEnabled() ? <>{children}</> : null;
}

function CanUsePrivateFiles({ children }: ChildrenProps) {
    const flags = useProjectFeatureFlags();
    return flags.isPrivateFilesEnabled() ? <>{children}</> : null;
}

function CanUseFileManagerThreatDetection({ children }: ChildrenProps) {
    const flags = useProjectFeatureFlags();
    return flags.isFileManagerThreatDetectionEnabled() ? <>{children}</> : null;
}

function CanUseHcmsFieldPermissions({ children }: ChildrenProps) {
    const flags = useProjectFeatureFlags();
    return flags.isHcmsFieldPermissionsEnabled() ? <>{children}</> : null;
}

function CanUseRemoteComponents({ children }: ChildrenProps) {
    const flags = useProjectFeatureFlags();
    return flags.isRemoteComponentsEnabled() ? <>{children}</> : null;
}

function CanUseAiPowerups({ children }: ChildrenProps) {
    const flags = useProjectFeatureFlags();
    return flags.isAiPowerupsEnabled() ? <>{children}</> : null;
}

export const FeatureFlag = {
    CanUseMultiTenancy,
    CanUseWorkflows,
    CanUseTeams,
    CanUsePrivateFiles,
    CanUseFileManagerThreatDetection,
    CanUseHcmsFieldPermissions,
    CanUseRemoteComponents,
    CanUseAiPowerups
};

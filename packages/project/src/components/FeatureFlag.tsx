import React from "react";
import type { FeatureFlagName } from "@webiny/feature-flags";
import { useProjectFeatureFlags } from "~/services/GetProjectConfigService/FeatureFlagsContext.js";

interface CanUseProps {
    name: FeatureFlagName;
    children: React.ReactNode;
}

function CanUse({ name, children }: CanUseProps) {
    const flags = useProjectFeatureFlags();
    return flags.isEnabled(name) ? <>{children}</> : null;
}

/**
 * For opt-in flags: renders only when the project config actually turns the flag on. `CanUse`
 * resolves an unset flag to ON for licensed projects (the license decorator reads anything outside
 * its LICENSE_CHECKS as `!isExplicitlyDisabled`), so a feature that must stay off until someone
 * asks for it cannot use it.
 */
function CanUseExplicitly({ name, children }: CanUseProps) {
    const flags = useProjectFeatureFlags();
    return flags.isExplicitlyEnabled(name) ? <>{children}</> : null;
}

function CanUseMultiTenancy({ children }: { children: React.ReactNode }) {
    return <CanUse name="multiTenancy">{children}</CanUse>;
}

function CanUseWorkflows({ children }: { children: React.ReactNode }) {
    return <CanUse name="advancedPublishingWorkflow">{children}</CanUse>;
}

function CanUseTeams({ children }: { children: React.ReactNode }) {
    return <CanUse name="advancedAccessControlLayer.teams">{children}</CanUse>;
}

function CanUsePrivateFiles({ children }: { children: React.ReactNode }) {
    return <CanUse name="advancedAccessControlLayer.privateFiles">{children}</CanUse>;
}

function CanUseFileManagerThreatDetection({ children }: { children: React.ReactNode }) {
    return <CanUse name="fileManager.threatDetection">{children}</CanUse>;
}

function CanUseHcmsFieldPermissions({ children }: { children: React.ReactNode }) {
    return <CanUse name="advancedAccessControlLayer.hcmsFieldPermissions">{children}</CanUse>;
}

function CanUseRemoteComponents({ children }: { children: React.ReactNode }) {
    return <CanUse name="remoteComponents">{children}</CanUse>;
}

function CanUseAiPowerups({ children }: { children: React.ReactNode }) {
    return <CanUse name="aiPowerups">{children}</CanUse>;
}

export const FeatureFlag = {
    CanUse,
    CanUseExplicitly,
    CanUseMultiTenancy,
    CanUseWorkflows,
    CanUseTeams,
    CanUsePrivateFiles,
    CanUseFileManagerThreatDetection,
    CanUseHcmsFieldPermissions,
    CanUseRemoteComponents,
    CanUseAiPowerups
};

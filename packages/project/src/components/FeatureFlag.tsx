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
    return <CanUse name="aiPowerups.remoteComponents">{children}</CanUse>;
}

function CanUseAiPowerups({ children }: { children: React.ReactNode }) {
    return <CanUse name="aiPowerups">{children}</CanUse>;
}

/**
 * Webhooks are on unless the project sets `webhooks: false`, so this can't go through `CanUse`:
 * `isEnabled` reads an unset flag as off (and, for a flag the license doesn't list, as off without a
 * license).
 */
function CanUseWebhooks({ children }: { children: React.ReactNode }) {
    const flags = useProjectFeatureFlags();
    return flags.isExplicitlyDisabled("webhooks") ? null : <>{children}</>;
}

export const FeatureFlag = {
    CanUse,
    CanUseMultiTenancy,
    CanUseWorkflows,
    CanUseTeams,
    CanUsePrivateFiles,
    CanUseFileManagerThreatDetection,
    CanUseHcmsFieldPermissions,
    CanUseRemoteComponents,
    CanUseAiPowerups,
    CanUseWebhooks
};

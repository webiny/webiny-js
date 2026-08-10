import { useFeatureFlags } from "@webiny/app-admin";

export const useCanUseWorkflows = () => {
    const featureFlags = useFeatureFlags();

    const canUseWorkflows = featureFlags.isEnabled("advancedPublishingWorkflow");

    return {
        canUseWorkflows
    };
};

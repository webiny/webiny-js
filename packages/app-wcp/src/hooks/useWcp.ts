import { useContext, useCallback } from "react";
import { WcpContext, WcpContextValue } from "../contexts";
import { WcpProject, WcpProjectPackage } from "~/types";

interface UseWcpHook {
    getProject: () => WcpProject | null;
    canUseFeature: (featureId: string) => boolean;
}

export function useWcp(): UseWcpHook {
    const context = useContext<WcpContextValue>(WcpContext);

    const getProject = useCallback(() => context.project, [context.project]);
    const canUseFeature = useCallback<any>(
        (featureId: keyof WcpProjectPackage["features"]) => {
            return context.project?.package?.features?.[featureId]?.enabled === true;
        },
        [context.project]
    );

    return { getProject, canUseFeature };
}
